import { writeConfig } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await writeConfig("notification-config", body);
  return { success: true };
});
