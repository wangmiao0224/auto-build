import { createSshHandle } from "~/server/utils/ssh";
import type { ServerConfig } from "~/types/server";
import { readConfig } from "~/server/utils/storage";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { serverId, path } = body;

  if (!serverId || !path) {
    return createError({
      statusCode: 400,
      message: "服务器ID和路径不能为空",
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

    let filesCommand: string;

    if (server.os === "windows") {
      const escapedPath = path.replace(/'/g, "''");
      filesCommand = `powershell -Command "$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-ChildItem -LiteralPath '${escapedPath}' | ForEach-Object { $_.Name + '|' + ($_.Mode -replace '[^a-z]', '') + '|' + $_.Length + '|' + $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss') }"`;
    } else {
      filesCommand = `ls -la "${path}"`;
    }

    const result = await ssh.exec(filesCommand);
    ssh.dispose();

    const output = result.stdout || result.stderr || "";

    const files = parseFileList(output, server.os || "linux", path);

    return {
      success: true,
      files,
    };
  } catch (error: any) {
    return createError({
      statusCode: 500,
      message: error.message || "获取文件列表失败",
    });
  }
});

function parseFileList(output: string, os: string, basePath: string) {
  const lines = output.split("\n").filter((line) => line.trim());
  const files: any[] = [];

  if (os === "windows") {
    lines.forEach((line) => {
      const trimmed = (line || "").trim();
      if (!trimmed) return;
      const parts = trimmed.split("|");
      if (parts.length >= 2) {
        const name = parts[0];
        const mode = parts[1] || "";
        const size = parseInt(parts[2] || "0") || 0;
        const mtime = parts[3] || "";
        if (name && name !== "." && name !== "..") {
          const isDir = mode.includes("d");
          files.push({
            name,
            path: basePath === "\\" ? `\\${name}` : `${basePath}\\${name}`,
            type: isDir ? "directory" : "file",
            size,
            mtime: mtime
              ? new Date(mtime).toISOString()
              : new Date().toISOString(),
          });
        }
      }
    });
  } else {
    lines.forEach((line) => {
      const parts = line.split(/\s+/);
      if (parts.length >= 9) {
        const permissions = parts[0];
        if (permissions === "total" || parts[8] === "." || parts[8] === "..")
          return;

        const size = parseInt(parts[4] || "0") || 0;
        const mtime = `${parts[5]} ${parts[6]} ${parts[7]}`;
        const name = parts.slice(8).join(" ");

        if (name) {
          files.push({
            name,
            path: basePath === "/" ? `/${name}` : `${basePath}/${name}`,
            type: (permissions || "").startsWith("d") ? "directory" : "file",
            size,
            mtime,
          });
        }
      }
    });
  }

  return files;
}
