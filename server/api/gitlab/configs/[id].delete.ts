import { deleteGitlabConfig } from "../../../utils/gitlab";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "ID 不能为空" });
  }

  const success = await deleteGitlabConfig(id);
  if (!success) {
    throw createError({ statusCode: 404, message: "配置不存在" });
  }

  return { success: true, message: "删除成功" };
});
