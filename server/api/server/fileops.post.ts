import { createSshHandle } from "~/server/utils/ssh";
import type { ServerConfig } from "~/types/server";
import { readConfig } from "~/server/utils/storage";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";

export default defineEventHandler(async (event) => {
  const contentType = event.node.req.headers["content-type"] || "";

  if (contentType.includes("multipart/form-data")) {
    return handleFileUpload(event);
  }

  const body = await readBody(event);
  const { serverId, action, path, newPath, content, fileName } = body;

  if (!serverId || !action || !path) {
    return createError({
      statusCode: 400,
      message: "缺少必要参数",
    });
  }

  try {
    const configs = await readConfig<ServerConfig[]>("server-configs", []);
    const server = configs.find((s: ServerConfig) => s.id === serverId);

    if (!server) {
      return createError({
        statusCode: 404,
        message: "服务器不存在",
      });
    }

    const ssh = await createSshHandle(server);
    let command = "";
    let result: any;

    if (server.os === "windows") {
      command = buildWindowsCommand(action, path, newPath, content, fileName);
    } else {
      command = buildLinuxCommand(action, path, newPath, content, fileName);
    }

    result = await ssh.exec(command);
    ssh.dispose();

    const output = result.stdout || result.stderr;

    if (result.code !== 0 && action !== "read") {
      return {
        success: false,
        message: output || "操作失败",
      };
    }

    return {
      success: true,
      output: action === "read" ? output : "操作成功",
      data: action === "read" ? output : undefined,
    };
  } catch (error: any) {
    return createError({
      statusCode: 500,
      message: error.message || "操作失败",
    });
  }
});

async function handleFileUpload(event: any) {
  const formData = await readMultipartFormData(event);
  if (!formData) {
    return createError({
      statusCode: 400,
      message: "无法解析上传文件",
    });
  }

  const serverIdField = formData.find((f: any) => f.name === "serverId");
  const targetPathField = formData.find((f: any) => f.name === "targetPath");
  const fileField = formData.find((f: any) => f.name === "file");

  if (!serverIdField || !targetPathField || !fileField) {
    return createError({
      statusCode: 400,
      message: "缺少必要参数",
    });
  }

  const serverId = serverIdField.data;
  const targetPath = targetPathField.data;
  const fileName = fileField.filename;
  const fileContent = fileField.data;

  try {
    const configs = await readConfig<ServerConfig[]>("server-configs", []);
    const server = configs.find((s: ServerConfig) => s.id === serverId);

    if (!server) {
      return createError({
        statusCode: 404,
        message: "服务器不存在",
      });
    }

    const uploadDir = join("/tmp", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const tempPath = join(uploadDir, fileName);
    await writeFile(tempPath, fileContent);

    const ssh = await createSshHandle(server);
    const fullPath =
      targetPath.endsWith("\\") || targetPath.endsWith("/")
        ? targetPath + fileName
        : targetPath;

    let command: string;
    if (server.os === "windows") {
      const escapedTemp = tempPath.replace(/'/g, "''");
      const escapedDest = fullPath.replace(/'/g, "''");
      command = `powershell -Command "Copy-Item -Path '${escapedTemp}' -Destination '${escapedDest}' -Force"`;
    } else {
      const escapedTemp = tempPath.replace(/'/g, "'\\''");
      const escapedDest = fullPath.replace(/'/g, "'\\''");
      command = `cp '${tempPath}' '${escapedDest}'`;
    }

    const result = await ssh.exec(command);
    await unlink(tempPath);
    ssh.dispose();

    if (result.code !== 0) {
      return {
        success: false,
        message: result.stderr || "上传失败",
      };
    }

    return {
      success: true,
      message: "文件上传成功",
    };
  } catch (error: any) {
    return createError({
      statusCode: 500,
      message: error.message || "上传失败",
    });
  }
}

function buildWindowsCommand(
  action: string,
  path: string,
  newPath?: string,
  content?: string,
  fileName?: string
): string {
  const escapedPath = path.replace(/'/g, "''");

  switch (action) {
    case "read":
      return `powershell -Command "$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Content -LiteralPath '${escapedPath}' -Raw -Encoding UTF8"`;

    case "createDir":
      const dirName = fileName || path.split("\\").pop();
      const parentPath = path.replace(/\\[^\\]+$/, "").replace(/'/g, "''");
      return `powershell -Command "New-Item -ItemType Directory -Path '${parentPath}\\${fileName}' -Force"`;

    case "delete":
      return `powershell -Command "Remove-Item -LiteralPath '${escapedPath}' -Recurse -Force"`;

    case "rename":
      if (!newPath) return "echo 'Missing new path'";
      const escapedNewPath = newPath.replace(/'/g, "''");
      return `powershell -Command "Rename-Item -LiteralPath '${escapedPath}' -NewName '${escapedNewPath}'"`;

    case "move":
      if (!newPath) return "echo 'Missing new path'";
      const escapedMoveDest = newPath.replace(/'/g, "''");
      return `powershell -Command "Move-Item -LiteralPath '${escapedPath}' -Destination '${escapedMoveDest}'"`;

    case "copy":
      if (!newPath) return "echo 'Missing new path'";
      const escapedCopyDest = newPath.replace(/'/g, "''");
      return `powershell -Command "Copy-Item -LiteralPath '${escapedPath}' -Destination '${escapedCopyDest}'"`;

    case "write":
      if (!content) return "echo 'Missing content'";
      const escapedContent = content
        .replace(/'/g, "''")
        .replace(/\r?\n/g, "`r`n");
      return `powershell -Command "Set-Content -LiteralPath '${escapedPath}' -Value '${escapedContent}' -Encoding UTF8"`;

    default:
      return "echo 'Unknown action'";
  }
}

function buildLinuxCommand(
  action: string,
  path: string,
  newPath?: string,
  content?: string,
  fileName?: string
): string {
  const escapedPath = path.replace(/'/g, "'\\''");

  switch (action) {
    case "read":
      return `cat '${escapedPath}'`;

    case "createDir":
      return `mkdir -p '${escapedPath}/${fileName}'`;

    case "delete":
      return `rm -rf '${escapedPath}'`;

    case "rename":
      if (!newPath) return "echo 'Missing new path'";
      const escapedNewPath = newPath.replace(/'/g, "'\\''");
      return `mv '${escapedPath}' '${escapedNewPath}'`;

    case "move":
      if (!newPath) return "echo 'Missing new path'";
      const escapedMoveDest = newPath.replace(/'/g, "'\\''");
      return `mv '${escapedPath}' '${escapedMoveDest}'`;

    case "copy":
      if (!newPath) return "echo 'Missing new path'";
      const escapedCopyDest = newPath.replace(/'/g, "'\\''");
      return `cp -r '${escapedPath}' '${escapedCopyDest}'`;

    case "write":
      if (!content) return "echo 'Missing content'";
      const escapedContent = content.replace(/'/g, "'\\''");
      return `echo '${escapedContent}' > '${escapedPath}'`;

    default:
      return "echo 'Unknown action'";
  }
}
