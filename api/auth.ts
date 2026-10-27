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
  requestPasswordReset,
  registerUserAccount,
  resetPassword,
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
  z.object({
    action: z.literal("requestPasswordReset"),
    email: z.string().email(),
  }),
  z.object({
    action: z.literal("resetPassword"),
    token: z.string().regex(/^[a-f0-9]{64}$/i),
    password: z.string().min(6),
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
  } else if (data.action === "requestPasswordReset") {
    await requestPasswordReset(data.email);
    json(response, 200, {
      success: true,
      message: "If an account exists for that email, reset instructions will be sent.",
    });
  } else if (data.action === "resetPassword") {
    await resetPassword(data.token, data.password);
    json(response, 200, { success: true });
  } else {
    await destroySession(context);
    json(response, 200, { success: true });
  }
});
