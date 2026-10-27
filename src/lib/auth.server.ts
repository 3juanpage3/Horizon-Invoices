import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import nodemailer from "nodemailer";

import { ensureIndexes, getDb } from "./db.server.js";
import { hashPassword, verifyPassword } from "./password.server.js";

export const SESSION_COOKIE = "horizon_session";
const SESSION_DAYS = 30;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;

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

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getPasswordResetUrl(token: string) {
  const configuredUrl = process.env.APP_URL;
  if (!configuredUrl) {
    throw new Error("APP_URL is not configured");
  }

  const appUrl = new URL(configuredUrl);
  if (
    (appUrl.protocol !== "https:" && appUrl.protocol !== "http:") ||
    !appUrl.hostname ||
    appUrl.username ||
    appUrl.password ||
    appUrl.pathname !== "/" ||
    appUrl.search ||
    appUrl.hash ||
    (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:")
  ) {
    throw new Error("APP_URL must be a production HTTPS origin");
  }

  const resetUrl = new URL("/reset-password", appUrl);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}

async function sendPasswordResetEmail(email: string, token: string) {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!gmailUser || !gmailAppPassword) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be configured");
  }

  const resetUrl = getPasswordResetUrl(token);
  const escapedUrl = resetUrl.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailAppPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  await transporter.sendMail({
    from: { name: "Horizon Invoices", address: gmailUser },
    to: email,
    subject: "Reset your Horizon Invoices password",
    text: `Use this link to reset your Horizon Invoices password. It expires in 30 minutes and can only be used once:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Use this link to reset your Horizon Invoices password. It expires in 30 minutes and can only be used once:</p><p><a href="${escapedUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}

export async function requestPasswordReset(emailInput: string) {
  await ensureIndexes();
  const db = await getDb();
  const email = emailInput.trim().toLowerCase();
  const emailHash = sha256(email);
  const now = new Date();
  const cutoff = new Date(now.getTime() - PASSWORD_RESET_COOLDOWN_MS);
  const requests = db.collection("passwordResetRequests");

  await requests.findOneAndUpdate(
    { emailHash },
    {
      $setOnInsert: {
        emailHash,
        requestedAt: new Date(now.getTime() - PASSWORD_RESET_COOLDOWN_MS),
      },
    },
    { upsert: true },
  );

  const requestSlot = await requests.findOneAndUpdate(
    { emailHash, requestedAt: { $lte: cutoff } },
    { $set: { requestedAt: now } },
  );
  if (!requestSlot) return;

  const user = await db.collection("users").findOne({ email });
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  await db.collection("passwordResetTokens").updateOne(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        tokenHash,
        expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
        createdAt: now,
      },
    },
    { upsert: true },
  );

  try {
    await sendPasswordResetEmail(email, token);
  } catch (error) {
    console.error("Password reset email delivery failed:", error);
    try {
      await Promise.all([
        db.collection("passwordResetTokens").deleteOne({ userId: user._id, tokenHash }),
        requests.updateOne({ emailHash, requestedAt: now }, { $set: { requestedAt: cutoff } }),
      ]);
    } catch (cleanupError) {
      console.error("Password reset cleanup failed:", cleanupError);
    }
  }
}

export async function resetPassword(token: string, password: string) {
  await ensureIndexes();
  const db = await getDb();
  const tokenHash = sha256(token);
  const reset = await db.collection("passwordResetTokens").findOneAndDelete({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!reset) {
    throw new Error("Invalid or expired password reset link");
  }

  const passwordHash = await hashPassword(password);
  const result = await db
    .collection("users")
    .updateOne({ _id: reset.userId }, { $set: { passwordHash } });
  if (result.matchedCount !== 1) {
    throw new Error("Invalid or expired password reset link");
  }

  await Promise.all([
    db.collection("sessions").deleteMany({ userId: reset.userId }),
    db.collection("passwordResetTokens").deleteMany({ userId: reset.userId }),
  ]);
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
