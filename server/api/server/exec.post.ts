import { createSshHandle } from "~/server/utils/ssh";
import type { ServerConfig } from "~/types/server";
import { readConfig } from "~/server/utils/storage";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { serverId, command } = body;

  if (!serverId || !command) {
    return createError({
      statusCode: 400,
      message: "服务器ID和命令不能为空",
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

    let execCommand = command;
    if (server.os === "windows") {
      execCommand = `powershell -Command "$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${command.replace(
        /"/g,
        '`"'
      )}"`;
    }

    const result = await ssh.exec(execCommand);
    ssh.dispose();

    const output = result.stdout || result.stderr;

    return {
      success: true,
      output,
    };
  } catch (error: any) {
    return createError({
      statusCode: 500,
      message: error.message || "执行命令失败",
    });
  }
});
