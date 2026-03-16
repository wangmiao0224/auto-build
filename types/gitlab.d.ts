export interface GitlabConfig {
  id: string;
  name: string;
  url: string;
  token: string;
  webhookSecret: string;
  apiTimeout: number;
  apiRetryCount: number;
  defaultBranch: string;
  proxyUrl: string;
  cacheTime: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GitlabConfigInput {
  name: string;
  url: string;
  token: string;
  webhookSecret?: string;
  apiTimeout?: number;
  apiRetryCount?: number;
  defaultBranch?: string;
  proxyUrl?: string;
  cacheTime?: number;
  isDefault?: boolean;
}

export interface GitlabTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  version?: string;
}
