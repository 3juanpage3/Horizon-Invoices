import { z } from "zod";

import {
  apiHandler,
  json,
  methodNotAllowed,
  readJson,
  sessionContext,
} from "../src/lib/api/http.server.js";
import {
  destroySession,
  getSessionData,
  loginUserAccount,
  registerUserAccount,
} from "../src/lib/auth.server.js";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("register"),
    username: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(6),
  }),
  z.object({
    action: z.literal("login"),
    usernameOrEmail: z.string().min(1),
    password: z.string().min(1),
  }),
  z.object({ action: z.literal("logout") }),
]);

export default apiHandler(async (request, response) => {
  const context = sessionContext(request, response);

  if (request.method === "GET") {
    json(response, 200, await getSessionData(context));
    return;
  }

  if (request.method !== "POST") {
    methodNotAllowed(response, ["GET", "POST"]);
    return;
  }

  const data = await readJson(request, actionSchema);
  if (data.action === "register") {
    json(response, 200, await registerUserAccount(data, context));
  } else if (data.action === "login") {
    json(response, 200, await loginUserAccount(data, context));
  } else {
    await destroySession(context);
    json(response, 200, { success: true });
  }
});
