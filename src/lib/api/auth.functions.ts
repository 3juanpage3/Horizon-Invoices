import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().min(2).max(50),
      email: z.string().email(),
      password: z.string().min(6),
    }),
  )
  .handler(async ({ data }) => {
    const { registerUserAccount } = await import("../auth.server");
    return registerUserAccount(data);
  });

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      usernameOrEmail: z.string().min(1),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { loginUserAccount } = await import("../auth.server");
    return loginUserAccount(data);
  });

export const logoutUser = createServerFn({ method: "POST" }).handler(async () => {
  const { destroySession } = await import("../auth.server");
  await destroySession();
  return { success: true };
});

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionData } = await import("../auth.server");
  return getSessionData();
});
