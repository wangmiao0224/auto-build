export interface CpuInfo {
  usage: number; // 百分比 0-100
  cores: number;
  model: string;
  loadAvg: [number, number, number];
}

export interface MemoryInfo {
  total: number; // bytes
  used: number;
  free: number;
  usage: number; // 百分比
}

export interface DiskInfo {
  device: string;
  mountpoint: string;
  total: number; // bytes
  used: number;
  free: number;
  usage: number; // 百分比
}

export interface NetworkInfo {
  interface: string;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: string;
  startedAt: string;
}

export interface PortInfo {
  port: number;
  protocol: "tcp" | "udp";
  state: string;
  pid: number;
  process: string;
}

export interface ServerMonitorStatus {
  serverId: string;
  serverName: string;
  host: string;
  online: boolean;
  collectedAt: string;
  cpu: CpuInfo;
  memory: MemoryInfo;
  disks: DiskInfo[];
  network: NetworkInfo[];
  processes: ProcessInfo[];
  ports: PortInfo[];
  uptime: number; // seconds
}

export interface MonitorHistoryPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  diskUsage: number;
  networkRx: number;
  networkTx: number;
}

export interface AlertRule {
  id: string;
  serverId: string;
  metric: "cpu" | "memory" | "disk" | "network";
  operator: ">" | ">=" | "<" | "<=";
  threshold: number;
  duration: number; // 持续时间（秒）
  notifyWechat: boolean;
  createdAt: string;
}

export interface AlertEvent {
  id: string;
  serverId: string;
  rule: AlertRule;
  value: number;
  triggeredAt: string;
  resolvedAt: string | null;
  notified: boolean;
}
