import type {
  GitLabProject,
  GitLabBranch,
  GitLabTrigger,
  ProjectConfig,
} from "~/types/project";

export const useProjectStore = defineStore("project", () => {
  const gitlabProjects = ref<GitLabProject[]>([]);
  const savedProjects = ref<ProjectConfig[]>([]);
  const currentProject = ref<GitLabProject | null>(null);
  const branches = ref<GitLabBranch[]>([]);
  const triggers = ref<GitLabTrigger[]>([]);
  const loading = ref(false);
  const searchQuery = ref("");

  async function fetchGitlabProjects(search = "") {
    loading.value = true;
    try {
      gitlabProjects.value = await $fetch("/api/gitlab/projects", {
        query: { search },
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchSavedProjects() {
    try {
      savedProjects.value = await $fetch("/api/projects");
    } catch {
      savedProjects.value = [];
    }
  }

  async function saveProject(config: Omit<ProjectConfig, "id"> & { id?: string }) {
    await $fetch("/api/projects", { method: "POST", body: config });
    await fetchSavedProjects();
  }

  async function deleteProject(id: string) {
    await $fetch(`/api/projects/${id}`, { method: "DELETE" });
    await fetchSavedProjects();
  }

  async function selectGitlabProject(project: GitLabProject) {
    currentProject.value = project;
    await Promise.all([fetchBranches(project.id), fetchTriggers(project.id)]);
  }

  async function fetchBranches(projectId: number) {
    branches.value = await $fetch(`/api/gitlab/projects/${projectId}/branches`);
  }

  async function fetchTriggers(projectId: number) {
    try {
      triggers.value = await $fetch(
        `/api/gitlab/projects/${projectId}/triggers`
      );
    } catch {
      triggers.value = [];
    }
  }

  function getProjectConfig(projectId: number): ProjectConfig | undefined {
    return savedProjects.value.find((p) => p.projectId === projectId);
  }

  return {
    gitlabProjects,
    savedProjects,
    currentProject,
    branches,
    triggers,
    loading,
    searchQuery,
    fetchGitlabProjects,
    fetchSavedProjects,
    saveProject,
    deleteProject,
    selectGitlabProject,
    fetchBranches,
    fetchTriggers,
    getProjectConfig,
  };
});
