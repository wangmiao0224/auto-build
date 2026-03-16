export interface GitLabProject {
  id: number;
  name: string;
  nameWithNamespace: string;
  description: string | null;
  webUrl: string;
  avatarUrl: string | null;
  defaultBranch: string;
  visibility: "private" | "internal" | "public";
  lastActivityAt: string;
}

export interface GitLabBranch {
  name: string;
  commit: {
    id: string;
    shortId: string;
    title: string;
    authorName: string;
    authoredDate: string;
  };
  protected: boolean;
  merged: boolean;
}

export interface GitLabTrigger {
  id: number;
  description: string;
  token: string;
  createdAt: string;
  lastUsed: string | null;
}

export interface ProjectConfig {
  id: string;
  gitlabId?: string;
  projectId: number;
  projectName: string;
  selectedBranch: string;
  selectedTriggerId: number | null;
  serverId?: string;
  updatedAt: string;
}
