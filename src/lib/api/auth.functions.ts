import { ObjectId } from "mongodb";
import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  createSession,
  destroySession,
  getSessionUser,
  userHasCompany,
} from "../auth.server";
import { ensureIndexes, getDb } from "../db.server";

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().min(2).max(50),
      email: z.string().email(),
      password: z.string().min(6),
    }),
  )
  .handler(async ({ data }) => {
    await ensureIndexes();
    const db = await getDb();
    const username = data.username.trim().toLowerCase();
    const email = data.email.trim().toLowerCase();

    const existing = await db.collection("users").findOne({
      $or: [{ username }, { email }],
    });
    if (existing) {
      throw new Error("Username or email is already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = await db.collection("users").insertOne({
      username,
      email,
      passwordHash,
      createdAt: new Date(),
    });

    await createSession(result.insertedId);
    return { success: true };
  });

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      usernameOrEmail: z.string().min(1),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await ensureIndexes();
    const db = await getDb();
    const key = data.usernameOrEmail.trim().toLowerCase();

    const user = await db.collection("users").findOne({
      $or: [{ username: key }, { email: key }],
    });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash as string))) {
      throw new Error("Invalid username/email or password");
    }

    await createSession(user._id);
    return { success: true };
  });

export const logoutUser = createServerFn({ method: "POST" }).handler(async () => {
  await destroySession();
  return { success: true };
});

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  await ensureIndexes();
  const user = await getSessionUser();
  if (!user) {
    return { user: null, hasCompany: false };
  }

  const hasCompany = await userHasCompany(new ObjectId(user.id));
  return { user, hasCompany };
});
