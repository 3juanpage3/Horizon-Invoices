import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";

import { ensureIndexes, getDb } from "./db.server.js";
import { hashPassword, verifyPassword } from "./password.server.js";

export const SESSION_COOKIE = "horizon_session";
const SESSION_DAYS = 30;

export type SessionContext = {
  getToken: () => string | undefined;
  setToken: (token: string, maxAge: number) => void;
  clearToken: () => void;
};

export type SessionUser = {
  id: string;
  username: string;
  email: string;
};

export async function createSession(userId: ObjectId, context: SessionContext) {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.collection("sessions").insertOne({
    token,
    userId,
    expiresAt,
    createdAt: new Date(),
  });

  context.setToken(token, SESSION_DAYS * 24 * 60 * 60);
}

export async function destroySession(context: SessionContext) {
  const token = context.getToken();
  if (token) {
    const db = await getDb();
    await db.collection("sessions").deleteOne({ token });
  }
  context.clearToken();
}

export async function getUserIdFromSession(context: SessionContext): Promise<ObjectId | null> {
  const token = context.getToken();
  if (!token) return null;

  const db = await getDb();
  const session = await db.collection("sessions").findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  return session.userId as ObjectId;
}

export async function requireUserId(context: SessionContext): Promise<ObjectId> {
  const userId = await getUserIdFromSession(context);
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getSessionUser(context: SessionContext): Promise<SessionUser | null> {
  const userId = await getUserIdFromSession(context);
  if (!userId) return null;

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: userId });
  if (!user) return null;

  return {
    id: user._id.toString(),
    username: user.username as string,
    email: user.email as string,
  };
}

export async function userHasCompany(userId: ObjectId): Promise<boolean> {
  const db = await getDb();
  const company = await db.collection("companies").findOne({ userId });
  return !!company?.onboardingComplete;
}

export type SessionData = {
  user: SessionUser | null;
  hasCompany: boolean;
  dbError: boolean;
};

export async function registerUserAccount(
  data: {
    username: string;
    email: string;
    password: string;
  },
  context: SessionContext,
) {
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

  const passwordHash = await hashPassword(data.password);
  const result = await db.collection("users").insertOne({
    username,
    email,
    passwordHash,
    createdAt: new Date(),
  });

  await createSession(result.insertedId, context);
  return { success: true };
}

export async function loginUserAccount(
  data: { usernameOrEmail: string; password: string },
  context: SessionContext,
) {
  await ensureIndexes();
  const db = await getDb();
  const key = data.usernameOrEmail.trim().toLowerCase();

  const user = await db.collection("users").findOne({
    $or: [{ username: key }, { email: key }],
  });

  if (!user || !(await verifyPassword(data.password, user.passwordHash as string))) {
    throw new Error("Invalid username/email or password");
  }

  await createSession(user._id, context);
  return { success: true };
}

export async function getSessionData(context: SessionContext): Promise<SessionData> {
  try {
    const user = await getSessionUser(context);
    if (!user) {
      return { user: null, hasCompany: false, dbError: false };
    }

    const hasCompany = await userHasCompany(new ObjectId(user.id));
    return { user, hasCompany, dbError: false };
  } catch (error) {
    console.error("getSessionData failed:", error);
    return { user: null, hasCompany: false, dbError: true };
  }
}
