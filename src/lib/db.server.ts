import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add your MongoDB connection string to .env");
  }
  return url;
}

function getDatabaseName() {
  const fromEnv = process.env.DATABASE_NAME?.trim();
  if (fromEnv) return fromEnv;

  // If the database name is in the connection string path, use it.
  // e.g. mongodb+srv://user:pass@cluster.mongodb.net/my_database?...
  const url = getDatabaseUrl();
  const match = url.match(/\.mongodb\.net\/([^/?]+)/) ?? url.match(/mongodb:\/\/[^/]+\/([^/?]+)/);
  if (match?.[1]) return match[1];

  return "horizon_invoices";
}

export async function getDb(): Promise<Db> {
  if (!globalThis.__mongoClientPromise) {
    const client = new MongoClient(getDatabaseUrl());
    globalThis.__mongoClientPromise = client.connect();
  }
  const client = await globalThis.__mongoClientPromise;
  return client.db(getDatabaseName());
}

export async function ensureIndexes() {
  const db = await getDb();
  await Promise.all([
    db.collection("users").createIndex({ username: 1 }, { unique: true }),
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ token: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("companies").createIndex({ userId: 1 }, { unique: true }),
    db.collection("inventory").createIndex({ userId: 1, id: 1 }, { unique: true }),
    db.collection("invoices").createIndex({ userId: 1, id: 1 }, { unique: true }),
    db.collection("invoices").createIndex({ userId: 1, savedAt: -1 }),
  ]);
}
