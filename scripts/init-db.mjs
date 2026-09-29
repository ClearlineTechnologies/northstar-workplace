import {
  existsSync,
  readFileSync,
  mkdirSync,
  closeSync,
  openSync,
  copyFileSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
if (!existsSync(".env") && existsSync(".env.example")) {
  copyFileSync(".env.example", ".env");
}
const envFile = existsSync(".env") ? readFileSync(".env", "utf8") : "";
const url =
  process.env.DATABASE_URL ||
  envFile.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)/m)?.[1] ||
  "file:./workcraft.db";
process.env.DATABASE_URL = url;
if (url.startsWith("file:")) {
  const path = resolve("prisma", url.slice(5).split("?")[0]);
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path)) closeSync(openSync(path, "a"));
}
for (const args of [
  ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"],
  ["node_modules/tsx/dist/cli.mjs", "src/database/seed.ts"],
]) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
