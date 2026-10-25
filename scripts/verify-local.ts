import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import mongoose from "mongoose";

const suffix = randomUUID().replaceAll("-", "");
const uri = (name: string) => `mongodb://127.0.0.1:27029/safetag_test_${suffix}_${name}`;
const reports = ".pilot-data/verification";
// Explicit blank values also override any .env.local credentials loaded by Next.js.
let environment: NodeJS.ProcessEnv = {
  ...process.env, MONGODB_URI: uri("browser"), TEST_MONGODB_URI: uri("unit"),
  NODE_ENV: "test", DEMO_MODE: "false", STORAGE_DRIVER: "mongo",
  TOKEN_SECRET: "synthetic-token-secret-for-local-tests-only-012345",
  SESSION_SECRET: "synthetic-session-secret-for-local-tests-only-012345",
  NEXTAUTH_SECRET: "synthetic-unused-nextauth-secret-local-only",
  NEXT_PUBLIC_APP_URL: "http://localhost:3100", NOTIFICATIONS_ENABLED: "false",
  ALLOW_AUTHORIZED_TEST_SEND: "false", LEGACY_NOTIFICATIONS_ENABLED: "false",
  NOTIFICATION_TEST_RECIPIENTS: "", TWILIO_ACCOUNT_SID: "", TWILIO_AUTH_TOKEN: "",
  TWILIO_VERIFY_SERVICE_SID: "", TWILIO_STORED_CONTENT_SID: "", TWILIO_RETURNED_CONTENT_SID: "",
  CLOUDINARY_CLOUD_NAME: "", CLOUDINARY_API_KEY: "", CLOUDINARY_API_SECRET: "",
  GOOGLE_VISION_API_KEY: "", GOOGLE_APPLICATION_CREDENTIALS: "", GOOGLE_APPLICATION_CREDENTIALS_JSON: "",
  GOOGLE_VISION_PROJECT_ID: "", GMAIL_USER: "", GMAIL_APP_PASSWORD: "",
  PLATFORM_ADMIN_PHONES: "", PLATFORM_ADMIN_TOTP_SECRET: "", CRON_SECRET: "",
};
const results: { check: string; passed: boolean; milliseconds: number }[] = [];
let server: ChildProcess | undefined;

async function run(check: string, args: string[]) {
  const start = Date.now();
  const log = createWriteStream(`${reports}/${check}.log`);
  const child = spawn(process.execPath, args, { env: environment, stdio: ["ignore", "pipe", "pipe"] });
  const timer = setTimeout(() => child.kill("SIGTERM"), 10 * 60_000);
  child.stdout!.on("data", (chunk) => { process.stdout.write(chunk); log.write(chunk); });
  child.stderr!.on("data", (chunk) => { process.stderr.write(chunk); log.write(chunk); });
  try {
    const status = await new Promise<number | null>((resolve, reject) => { child.once("error", reject); child.once("exit", resolve); });
    results.push({ check, passed: status === 0, milliseconds: Date.now() - start });
    if (status !== 0) throw new Error(`${check} failed (exit ${status}); see ${reports}`);
  } finally { clearTimeout(timer); log.end(); }
}

async function main() {
  if (Number(process.versions.node.split(".")[0]) < 22) throw new Error("Node 22 or newer is required");
  await mkdir(reports, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const probe = createServer(); probe.once("error", reject);
    probe.listen(3100, "127.0.0.1", () => probe.close(() => resolve()));
  });
  await run("runner", ["--import", "tsx", "-e", "const ts=require('typescript'); if(!ts.version||typeof require('tsx/cjs/api').register!=='function'||!require('mongoose/node_modules/mongodb').Collection)process.exit(1); console.log('Runner/compiler/driver OK',process.version,ts.version)"]);
  await run("typecheck", ["node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false"]);
  await run("lint", ["node_modules/eslint/bin/eslint.js", "app", "components", "lib", "models", "tests", "scripts", "types", "--max-warnings", "0"]);
  environment = { ...environment, NODE_ENV: "test" };
  const tests = (await readdir("tests")).filter((file) => file.endsWith(".test.mts")).map((file) => `tests/${file}`);
  if (!tests.length) throw new Error("No integration tests found");
  await run("integration", ["--import", "tsx", "--test", "--test-concurrency=1", ...tests]);
  environment = { ...environment, NODE_ENV: "production" };
  await run("build", ["node_modules/next/dist/bin/next", "build", "--webpack"]);
  // Index creation is explicit for fixtures; never enable production autoIndex.
  environment = { ...environment, NODE_ENV: "test" };
  await run("fixtures", ["--import", "tsx", "scripts/pilot-test-fixture.ts"]);
  environment = { ...environment, NODE_ENV: "production" };
  const serverLog = createWriteStream(`${reports}/server.log`);
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"], { env: environment, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout!.pipe(serverLog, { end: false }); server.stderr!.pipe(serverLog, { end: false });
  server.once("close", () => serverLog.end());
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("Local server exited before becoming ready");
    try { ready = (await fetch("http://127.0.0.1:3100/api/health", { signal: AbortSignal.timeout(1000) })).ok; } catch { /* bounded readiness poll */ }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error("Synthetic local app health check did not become ready");
  await run("browser", ["node_modules/@playwright/test/cli.js", "test"]);
}

async function cleanup() {
  if (server && server.exitCode === null) {
    const child = server;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => { child.kill("SIGKILL"); resolve(); }, 5000);
      child.once("exit", () => { clearTimeout(timer); resolve(); }); child.kill("SIGTERM");
    });
  }
  // These names are generated in this process and can never target another environment.
  for (const name of ["unit", "browser"]) {
    const connection = await mongoose.createConnection(uri(name), { serverSelectionTimeoutMS: 3000 }).asPromise();
    try { await connection.dropDatabase(); } finally { await connection.close(); }
  }
  await writeFile(`${reports}/results.json`, JSON.stringify({ verifiedAt: new Date().toISOString(), source: process.cwd(), syntheticLocalMongoOnly: true, liveNotifications: false, results }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Local verification failed"); process.exitCode = 1; })
  .finally(() => cleanup().catch((error) => { console.error("Synthetic cleanup failed:", error instanceof Error ? error.message : "unknown"); process.exitCode = 1; }));
