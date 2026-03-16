export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  privateKey: string;
  passphrase: string;
  workDir: string;
  os: "windows" | "linux";
  group: string;
  envVars: string;
  preDeployScript: string;
  postDeployScript: string;
  healthCheckUrl: string;
  healthCheckTimeout: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServerConfigInput {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  privateKey: string;
  passphrase: string;
  workDir: string;
  os: "windows" | "linux";
  group: string;
  envVars: string;
  preDeployScript: string;
  postDeployScript: string;
  healthCheckUrl: string;
  healthCheckTimeout: number;
  description?: string;
}

export type ServerTestResult = {
  success: boolean;
  message: string;
  latencyMs?: number;
};

export interface Artifact {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
  projectId?: number;
  branch?: string;
}

export interface RunConfig {
  id: string;
  name: string;
  artifactName: string;
  serverId: string;
  proxyIp: string;
  nginxConfig: string;
  port?: number;
  status: "running" | "stopped" | "error" | "unknown";
  pid?: number;
  startedAt?: string;
  stoppedAt?: string;
  createdAt: string;
}

export interface RunConfigInput {
  name: string;
  artifactName: string;
  serverId: string;
  proxyIp: string;
  nginxConfig: string;
  port?: number;
}

export interface NginxStatus {
  installed: boolean;
  running: boolean;
  version?: string;
  configPath?: string;
  error?: string;
}

export interface NginxConfig {
  workerProcesses: "auto" | number;
  workerConnections: number;
  keepaliveTimeout: number;
  clientMaxBodySize: string;
  gzip: boolean;
  gzipLevel: number;
  gzipTypes: string[];
  cacheEnabled: boolean;
  cacheDuration: string;
  httpPort: number;
  httpsPort: number;
}

export interface NginxSite {
  name: string;
  serverName: string;
  root: string;
  port: number;
  ssl: boolean;
  sslCert?: string;
  sslKey?: string;
  http2: boolean;
  locations: NginxLocation[];
  enabled: boolean;
}

export interface NginxLocation {
  path: string;
  proxyPass?: string;
  root?: string;
  tryFiles?: string;
  rewrite?: string;
}

export interface NginxInstallConfig {
  httpPort: number;
  httpsPort: number;
  workerProcesses: "auto" | number;
  gzip: boolean;
  gzipLevel: number;
  cacheEnabled: boolean;
  enableSsl: boolean;
  sslCert?: string;
  sslKey?: string;
}

export interface NginxInstallResult {
  success: boolean;
  message: string;
  version?: string;
  error?: string;
}

export interface DockerStatus {
  installed: boolean;
  running: boolean;
  version?: string;
  error?: string;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: "running" | "exited" | "paused" | "created" | "unknown";
  state: string;
  ports: DockerPort[];
  created: string;
  ip?: string;
}

export interface DockerPort {
  containerPort: number;
  hostPort?: number;
  protocol?: string;
}

export interface DockerImage {
  id: string;
  name: string;
  tag: string;
  size: string;
  created: string;
}

export interface DockerDeployConfig {
  name: string;
  type: "static" | "nodejs" | "custom";
  serverId: string;
  artifactPath?: string;
  port: number;
  envVars?: Record<string, string>;
  image?: string;
  buildContext?: string;
  dockerfile?: string;
  volumes?: string[];
  restartPolicy?: "always" | "unless-stopped" | "on-failure" | "no";
}

export interface DockerDeployResult {
  success: boolean;
  message: string;
  containerId?: string;
  error?: string;
}
