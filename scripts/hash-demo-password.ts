import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { hashDemoPassword } from "../lib/demo-auth";

async function main() {
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    const password = await new Promise<string>((resolve, reject) => {
      let answered = false;
      readline.once("line", (line) => {
        answered = true;
        resolve(line);
      });
      readline.once("close", () => {
        if (!answered) reject(new Error("Password input is required."));
      });
      stdout.write("Enter a demo password (at least 12 characters): ");
    });
    if (password.length < 12) {
      throw new Error("Demo password must be at least 12 characters.");
    }
    console.log(`DEMO_PASSWORD_HASH=${await hashDemoPassword(password)}`);
  } finally {
    readline.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to hash demo password.");
  process.exitCode = 1;
});
