import { getServerConfig, createSshHandle } from "../../utils/ssh";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const serverId = String(query.serverId || "");
  const filePath = String(query.path || "");

  if (!serverId || !filePath)
    throw createError({
      statusCode: 400,
      message: "serverId and path required",
    });

  const cfg = await getServerConfig(serverId);
  if (!cfg) throw createError({ statusCode: 404, message: "Server not found" });

  const ssh = await createSshHandle(cfg);
  try {
    const basePath = (cfg as any).artifactsPath || "/opt/artifacts";
    const fullPath = `${basePath}/${filePath}`;
    const fileName = filePath.split("/").pop() || "download";

    // 读取文件内容（base64）
    const { stdout, code } = await ssh.exec(`base64 -w 0 "${fullPath}" 2>&1`);
    if (code !== 0)
      throw createError({ statusCode: 404, message: "文件不存在或无法读取" });

    const buffer = Buffer.from(stdout.trim(), "base64");

    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    setHeader(event, "Content-Type", "application/octet-stream");
    setHeader(event, "Content-Length", String(buffer.length));

    return buffer;
  } finally {
    ssh.dispose();
  }
});
