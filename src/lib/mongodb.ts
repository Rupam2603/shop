import { MongoClient, Db, Collection } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MONGODB_URI = import.meta.env.VITE_MONGODB_URI ||
  "mongodb+srv://subhonehealthgroup_db_user:njrc4zTmwUKB7hHb@cluster0.m528hq0.mongodb.net/";
const DB_NAME = import.meta.env.VITE_MONGODB_DB || "subhone_store";

/**
 * Connect to MongoDB
 */
export async function connectMongoDB(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedClient = client;
    cachedDb = client.db(DB_NAME);
    console.log("✅ Connected to MongoDB:", DB_NAME);
    return cachedDb;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

/**
 * Get MongoDB database instance
 */
export async function getDB(): Promise<Db> {
  if (!cachedDb) {
    await connectMongoDB();
  }
  return cachedDb!;
}

/**
 * Get collection from MongoDB
 */
export async function getCollection<T>(
  collectionName: string
): Promise<Collection<T>> {
  const db = await getDB();
  return db.collection<T>(collectionName);
}

/**
 * Close MongoDB connection
 */
export async function closeMongoDB(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log("🔌 MongoDB connection closed");
  }
}

// Export connection types
export type { Db, Collection };
