import mongoose from "mongoose";
import { isDemoMode } from "@/lib/demo-mode";


declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectToDatabase() {
  if (isDemoMode()) return null;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required outside explicit demo mode.");
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 5000, autoIndex: process.env.NODE_ENV !== "production" });
  }

  try { cached.conn = await cached.promise; }
  catch (error) { cached.promise = null; throw error; }
  return cached.conn;
}

export function isMongoConfigured() {
  if (isDemoMode()) return false;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required. Sample data is available only in explicit DEMO_MODE.");
  return true;
}
