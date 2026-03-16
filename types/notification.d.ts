export interface NotificationConfig {
  dingtalk: {
    enabled: boolean;
    webhook: string;
    secret: string;
    template: string;
    onSuccess: boolean;
    onFailure: boolean;
    atUserIds: string[];
    atMobiles: string[];
  };
  wecom: {
    enabled: boolean;
    webhook: string;
    template: string;
    onSuccess: boolean;
    onFailure: boolean;
    atUserIds: string[];
  };
  webhook: {
    enabled: boolean;
    url: string;
    method: string;
    auth: string;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  rateLimit: {
    enabled: boolean;
    intervalMinutes: number;
  };
}
