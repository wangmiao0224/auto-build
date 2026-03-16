import { getServerConfig, createSshHandle } from "../../utils/ssh";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const serverId = String(query.serverId || "");

  if (!serverId)
    throw createError({ statusCode: 400, message: "serverId required" });

  const cfg = await getServerConfig(serverId);
  if (!cfg) throw createError({ statusCode: 404, message: "Server not found" });

  const ssh = await createSshHandle(cfg);
  try {
    // 一次性获取所有指标
    const script = `
echo "=CPU="
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | tr -d '%us,'
echo "=MEM="
free -b | awk '/^Mem:/{print $2,$3}'
echo "=DISK="
df -B1 / | awk 'NR==2{print $2,$3}'
echo "=LOAD="
cat /proc/loadavg | awk '{print $1,$2,$3}'
echo "=UPTIME="
uptime -p 2>/dev/null || uptime
`.trim();

    const { stdout } = await ssh.exec(script);
    const sections: Record<string, string> = {};
    let current = "";
    for (const line of stdout.split("\n")) {
      const m = line.match(/^=(\w+)=$/);
      if (m) {
        current = m[1];
        sections[current] = "";
      } else if (current) sections[current] = (sections[current] + line).trim();
    }

    // CPU
    const cpu = parseFloat(sections.CPU || "0") || 0;

    // Memory
    const memParts = (sections.MEM || "0 0").split(" ").map(Number);
    const memTotalN = memParts[0] ?? 0;
    const memUsedN = memParts[1] ?? 0;
    const memPercent = memTotalN > 0 ? (memUsedN / memTotalN) * 100 : 0;

    // Disk
    const diskParts = (sections.DISK || "0 0").split(" ").map(Number);
    const diskTotalN = diskParts[0] ?? 0;
    const diskUsedN = diskParts[1] ?? 0;
    const diskPercent = diskTotalN > 0 ? (diskUsedN / diskTotalN) * 100 : 0;

    return {
      cpu,
      memPercent,
      memUsed: formatBytes(memUsedN),
      memTotal: formatBytes(memTotalN),
      diskPercent,
      diskUsed: formatBytes(diskUsedN),
      diskTotal: formatBytes(diskTotalN),
      loadAvg: sections.LOAD || "--",
      uptime: sections.UPTIME || "--",
    };
  } finally {
    ssh.dispose();
  }
});

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
