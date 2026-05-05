#!/usr/bin/env node
/**
 * Wait until the Express API answers /api/health (used before starting Next in `npm run dev`).
 */
import http from "http";
import path from "path";
import { readEnvFile, repoRoot } from "./parse-env-file.mjs";

const root = repoRoot();
const be = readEnvFile(path.join(root, "backend", ".env"));
const fe = readEnvFile(path.join(root, "frontend", ".env.local"));

const portFromBackend = parseInt(String(be.PORT || "5000"), 10) || 5000;
const apiUrlRaw = fe.NEXT_PUBLIC_API_URL;
const m = apiUrlRaw ? String(apiUrlRaw).match(/https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)/i) : null;
const portFromFrontend = m ? parseInt(m[1], 10) : null;

if (portFromFrontend != null && portFromFrontend !== portFromBackend) {
  console.error(
    `[wait-for-api] PORT mismatch: backend/.env has PORT=${portFromBackend} but frontend/.env.local targets port ${portFromFrontend}.`
  );
  console.error("  Fix one side so they match, then run npm run dev again.");
  process.exit(1);
}

const port = portFromBackend;
const maxMs = 120_000;
const intervalMs = 400;
const start = Date.now();

function ping() {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: "127.0.0.1", port, path: "/api/health", timeout: 3000 }, (res) => {
      res.resume();
      if (res.statusCode === 200) resolve(true);
      else reject(new Error(`HTTP ${res.statusCode}`));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function main() {
  process.stdout.write(`[wait-for-api] Waiting for http://127.0.0.1:${port}/api/health …\n`);
  for (;;) {
    try {
      await ping();
      console.log(`[wait-for-api] API is up on port ${port}. Starting Next.js…`);
      process.exit(0);
    } catch {
      if (Date.now() - start > maxMs) {
        console.error(`[wait-for-api] Timed out after ${maxMs / 1000}s. Is the backend running on PORT=${port}?`);
        console.error("  Check backend/.env (SUPABASE_*, PORT) and run: npm run dev:backend");
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

main();
