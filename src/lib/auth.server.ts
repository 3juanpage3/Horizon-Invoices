import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

import { getDb } from "./db.server";

export const SESSION_COOKIE = "horizon_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  username: string;
  email: string;
};

export async function createSession(userId: ObjectId) {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.collection("sessions").insertOne({
    token,
    userId,
    expiresAt,
    createdAt: new Date(),
  });

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    const db = await getDb();
    await db.collection("sessions").deleteOne({ token });
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export async function getUserIdFromSession(): Promise<ObjectId | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const db = await getDb();
  const session = await db.collection("sessions").findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  return session.userId as ObjectId;
}

export async function requireUserId(): Promise<ObjectId> {
  const userId = await getUserIdFromSession();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const userId = await getUserIdFromSession();
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
