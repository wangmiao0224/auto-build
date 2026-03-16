import { Client, ClientChannel } from "ssh2";
import { readConfig } from "./storage";
import type { ServerConfig } from "../../types/server";
import * as iconv from "iconv-lite";

export interface SshHandle {
  exec(
    command: string
  ): Promise<{ stdout: string; stderr: string; code: number }>;
  dispose(): void;
}

export async function getServerConfig(
  serverId: string
): Promise<ServerConfig | undefined> {
  const configs = await readConfig<ServerConfig[]>("server-configs", []);
  return configs.find((c) => c.id === serverId);
}

export function createSshHandle(cfg: ServerConfig): Promise<SshHandle> {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    const timer = setTimeout(() => {
      conn.destroy();
      reject(new Error("SSH 连接超时"));
    }, 15000);

    const connectConfig: any = {
      host: cfg.host,
      port: cfg.port || 22,
      username: cfg.username,
      readyTimeout: 15000,
    };

    if (cfg.privateKey) {
      connectConfig.privateKey = cfg.privateKey;
      if (cfg.passphrase) {
        connectConfig.passphrase = cfg.passphrase;
      }
    } else if (cfg.password) {
      connectConfig.password = cfg.password;
    }

    const isWindows = cfg.os === "windows";

    conn
      .on("ready", () => {
        clearTimeout(timer);
        resolve({
          exec(command: string) {
            return new Promise((res, rej) => {
              conn.exec(command, (err, stream: ClientChannel) => {
                if (err) return rej(err);
                let stdoutChunks: Buffer[] = [];
                let stderrChunks: Buffer[] = [];
                stream
                  .on("close", (code: number) => {
                    const stdoutBuffer = Buffer.concat(stdoutChunks);
                    const stderrBuffer = Buffer.concat(stderrChunks);
                    let stdout: string;
                    let stderr: string;
                    if (isWindows) {
                      stdout = iconv.decode(stdoutBuffer, "gbk");
                      stderr = iconv.decode(stderrBuffer, "gbk");
                    } else {
                      stdout = stdoutBuffer.toString("utf8");
                      stderr = stderrBuffer.toString("utf8");
                    }
                    res({ stdout, stderr, code: code ?? 0 });
                  })
                  .on("data", (data: Buffer) => {
                    stdoutChunks.push(data);
                  })
                  .stderr.on("data", (data: Buffer) => {
                    stderrChunks.push(data);
                  });
              });
            });
          },
          dispose() {
            conn.end();
          },
        });
      })
      .on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      })
      .connect(connectConfig);
  });
}
