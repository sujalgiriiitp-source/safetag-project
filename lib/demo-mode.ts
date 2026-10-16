export function isDemoMode() {
  const setting = process.env.DEMO_MODE?.trim().toLowerCase();
  if (setting && setting !== "true" && setting !== "false") {
    throw new Error("DEMO_MODE must be either true or false.");
  }

  const enabled = setting === "true";
  if (!enabled) return false;

  if (process.env.NODE_ENV === "production") {
    throw new Error("DEMO_MODE cannot be enabled in production.");
  }
  if (process.env.MONGODB_URI?.trim()) {
    throw new Error("DEMO_MODE cannot be used with MONGODB_URI. Remove it to use isolated demo data.");
  }
  if (!process.env.SESSION_SECRET || Buffer.byteLength(process.env.SESSION_SECRET) < 32) {
    throw new Error("DEMO_MODE requires SESSION_SECRET to contain at least 32 bytes.");
  }
  if (!process.env.DEMO_USERNAME?.trim() || !process.env.DEMO_PASSWORD_HASH?.trim()) {
    throw new Error("DEMO_MODE requires DEMO_USERNAME and DEMO_PASSWORD_HASH.");
  }

  return true;
}
