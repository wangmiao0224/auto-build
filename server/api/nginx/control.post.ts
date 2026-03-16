import { z } from "zod";
import { getServerConfig, createSshHandle } from "../../utils/ssh";

const schema = z.object({
  serverId: z.string(),
  action: z.enum(["start", "stop", "restart", "reload", "test"]),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "参数验证失败",
    });
  }

  const { serverId, action } = parsed.data;
  const server = await getServerConfig(serverId);

  if (!server) {
    throw createError({ statusCode: 404, message: "服务器不存在" });
  }

  const ssh = await createSshHandle(server);
  try {
    if (server.os === "windows") {
      const nginxDir = `${server.workDir}\\nginx`;
      let cmd: string;
      let successMsg: string;

      switch (action) {
        case "start":
          cmd = `powershell -Command "Start-Process -FilePath '${nginxDir}\\\\nginx.exe' -WorkingDirectory '${nginxDir}' -WindowStyle Hidden"`;
          successMsg = "Nginx 已启动";
          break;
        case "stop":
          cmd = `powershell -Command "Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force; if ($?) { Write-Output 'Stopped' } else { Write-Output 'Not running' }"`;
          successMsg = "Nginx 已停止";
          break;
        case "restart":
          cmd = `powershell -Command "Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 2; Start-Process -FilePath '${nginxDir}\\\\nginx.exe' -WorkingDirectory '${nginxDir}' -WindowStyle Hidden"`;
          successMsg = "Nginx 已重启";
          break;
        case "reload":
          cmd = `cmd /c "cd /d ${nginxDir} && nginx -s reload"`;
          successMsg = "Nginx 配置已重载";
          break;
        case "test":
          cmd = `cmd /c "cd /d ${nginxDir} && nginx -t 2>&1"`;
          successMsg = "配置验证通过";
          break;
        default:
          throw createError({ statusCode: 400, message: "未知操作" });
      }

      const { stdout, stderr, code } = await ssh.exec(cmd);

      if (action === "test") {
        if (
          stdout.includes("test is successful") ||
          stdout.includes("syntax is ok")
        ) {
          return {
            success: true,
            message: successMsg,
            output: stdout,
          };
        }
        return {
          success: false,
          message: `配置验证失败: ${stdout}`,
          output: stdout,
        };
      }

      if (action === "start") {
        return {
          success: true,
          message: successMsg,
        };
      }

      if (
        action === "stop" &&
        (stdout.includes("Not running") || stdout.includes("Stopped"))
      ) {
        return {
          success: true,
          message: stdout.includes("Not running")
            ? "Nginx 未在运行"
            : successMsg,
        };
      }

      if (code !== 0 && stderr && !stdout.includes("Nginx not running")) {
        return {
          success: false,
          message: `操作失败: ${stderr}`,
        };
      }

      return {
        success: true,
        message: successMsg,
      };
    }

    let cmd: string;
    let successMsg: string;

    switch (action) {
      case "start":
        cmd =
          "sudo systemctl start nginx 2>/dev/null || sudo service nginx start 2>/dev/null || sudo nginx";
        successMsg = "Nginx 已启动";
        break;
      case "stop":
        cmd =
          "sudo systemctl stop nginx 2>/dev/null || sudo service nginx stop 2>/dev/null || sudo nginx -s stop";
        successMsg = "Nginx 已停止";
        break;
      case "restart":
        cmd =
          "sudo systemctl restart nginx 2>/dev/null || sudo service nginx restart 2>/dev/null || (sudo nginx -s stop && sleep 1 && sudo nginx)";
        successMsg = "Nginx 已重启";
        break;
      case "reload":
        cmd =
          "sudo nginx -s reload 2>/dev/null || sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload 2>/dev/null";
        successMsg = "Nginx 配置已重载";
        break;
      case "test":
        cmd = "sudo nginx -t 2>&1";
        successMsg = "配置验证通过";
        break;
      default:
        throw createError({ statusCode: 400, message: "未知操作" });
    }

    const { code, stdout, stderr } = await ssh.exec(cmd);

    if (code !== 0) {
      return {
        success: false,
        message:
          action === "test"
            ? `配置验证失败: ${stderr || stdout}`
            : `操作失败: ${stderr || stdout}`,
        output: stdout + stderr,
      };
    }

    return {
      success: true,
      message: successMsg,
      output: action === "test" ? stdout : undefined,
    };
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: `操作异常: ${(err as Error).message}`,
    });
  } finally {
    ssh.dispose();
  }
});
