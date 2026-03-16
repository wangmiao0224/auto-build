import { z } from "zod";
import { getServerConfig, createSshHandle } from "../../utils/ssh";
import type { NginxSite } from "../../../types/server";

const schema = z.object({
  serverId: z.string(),
  action: z.enum(["create", "update", "delete", "toggle"]),
  site: z.object({
    name: z.string(),
    serverName: z.string(),
    root: z.string(),
    port: z.number().default(80),
    ssl: z.boolean().default(false),
    sslCert: z.string().optional(),
    sslKey: z.string().optional(),
    http2: z.boolean().default(false),
    enabled: z.boolean().default(true),
    proxyPass: z.string().optional(),
  }).optional(),
});

function generateSiteConf(site: NginxSite & { proxyPass?: string }): string {
  const lines: string[] = [];

  lines.push(`server {`);
  lines.push(`    listen ${site.port}${site.ssl ? " ssl" : ""}${site.http2 ? " http2" : ""};`);
  lines.push(`    server_name ${site.serverName};`);
  lines.push("");

  if (site.ssl && site.sslCert && site.sslKey) {
    lines.push(`    ssl_certificate ${site.sslCert};`);
    lines.push(`    ssl_certificate_key ${site.sslKey};`);
    lines.push(`    ssl_protocols TLSv1.2 TLSv1.3;`);
    lines.push(`    ssl_ciphers HIGH:!aNULL:!MD5;`);
    lines.push("");
  }

  if (site.proxyPass) {
    lines.push(`    location / {`);
    lines.push(`        proxy_pass ${site.proxyPass};`);
    lines.push(`        proxy_set_header Host $host;`);
    lines.push(`        proxy_set_header X-Real-IP $remote_addr;`);
    lines.push(`        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`);
    lines.push(`        proxy_set_header X-Forwarded-Proto $scheme;`);
    lines.push(`    }`);
  } else if (site.root) {
    lines.push(`    root ${site.root};`);
    lines.push(`    index index.html index.htm;`);
    lines.push("");
    lines.push(`    location / {`);
    lines.push(`        try_files $uri $uri/ /index.html;`);
    lines.push(`    }`);
  }

  lines.push("");
  lines.push(`    access_log /var/log/nginx/${site.name}.access.log;`);
  lines.push(`    error_log /var/log/nginx/${site.name}.error.log;`);
  lines.push(`}`);

  return lines.join("\n");
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "参数验证失败",
    });
  }

  const { serverId, action, site } = parsed.data;
  const server = await getServerConfig(serverId);

  if (!server) {
    throw createError({ statusCode: 404, message: "服务器不存在" });
  }

  if (server.os === "windows") {
    throw createError({ statusCode: 400, message: "Windows 暂不支持站点管理" });
  }

  if (!site) {
    throw createError({ statusCode: 400, message: "站点信息不能为空" });
  }

  const ssh = await createSshHandle(server);
  try {
    const siteName = site.name.endsWith(".conf") ? site.name : `${site.name}.conf`;
    const availablePath = `/etc/nginx/sites-available/${siteName}`;
    const enabledPath = `/etc/nginx/sites-enabled/${siteName}`;
    const confdPath = `/etc/nginx/conf.d/${siteName}`;

    if (action === "create" || action === "update") {
      const siteConf = generateSiteConf(site as NginxSite & { proxyPass?: string });

      const { code: writeCode } = await ssh.exec(
        `echo '${siteConf.replace(/'/g, "'\\''")}' | sudo tee ${availablePath}`
      );

      if (writeCode !== 0) {
        throw createError({ statusCode: 500, message: "写入站点配置失败" });
      }

      if (site.enabled) {
        await ssh.exec(`sudo ln -sf ${availablePath} ${enabledPath} 2>/dev/null || true`);
      } else {
        await ssh.exec(`sudo rm -f ${enabledPath} 2>/dev/null || true`);
      }
    }

    if (action === "delete") {
      await ssh.exec(`sudo rm -f ${availablePath} ${enabledPath} ${confdPath} 2>/dev/null || true`);
    }

    if (action === "toggle") {
      if (site.enabled) {
        await ssh.exec(`sudo ln -sf ${availablePath} ${enabledPath} 2>/dev/null || true`);
      } else {
        await ssh.exec(`sudo rm -f ${enabledPath} 2>/dev/null || true`);
      }
    }

    const { code: testCode, stderr: testErr } = await ssh.exec("sudo nginx -t 2>&1");
    if (testCode !== 0) {
      throw createError({ statusCode: 400, message: `配置验证失败: ${testErr}` });
    }

    await ssh.exec("sudo nginx -s reload 2>/dev/null || sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload 2>/dev/null");

    return { success: true, message: `站点${action === "create" ? "创建" : action === "update" ? "更新" : action === "delete" ? "删除" : "切换"}成功` };
  } catch (err) {
    if ((err as any).statusCode) throw err;
    throw createError({
      statusCode: 500,
      message: `操作失败: ${(err as Error).message}`,
    });
  } finally {
    ssh.dispose();
  }
});
