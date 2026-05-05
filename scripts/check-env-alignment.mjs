#!/usr/bin/env node
/**
 * Compare backend PORT with frontend NEXT_PUBLIC_API_URL port.
 * Run from repo root: npm run check:env
 */
import http from "http";
import path from "path";
import { readEnvFile, repoRoot } from "./parse-env-file.mjs";

const root = repoRoot();
const be = readEnvFile(path.join(root, "backend", ".env"));
const fe = readEnvFile(path.join(root, "frontend", ".env.local"));

const portBackend = parseInt(String(be.PORT || "5000"), 10) || 5000;
const apiUrlRaw = fe.NEXT_PUBLIC_API_URL;
const m = apiUrlRaw ? String(apiUrlRaw).match(/https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)/i) : null;
const portFrontend = m ? parseInt(m[1], 10) : null;

let ok = true;
if (portFrontend != null && portFrontend !== portBackend) {
  console.error(
    `[check:env] Port mismatch: backend/.env PORT=${portBackend} but frontend/.env.local NEXT_PUBLIC_API_URL uses port ${portFrontend}.`
  );
  console.error(`  Set PORT=${portFrontend} in backend/.env, or set NEXT_PUBLIC_API_URL=http://localhost:${portBackend}/api (and matching NEXT_PUBLIC_SITE_ORIGIN).`);
  ok = false;
} else if (portFrontend == null) {
  console.log(`[check:env] No frontend/.env.local (or no NEXT_PUBLIC_API_URL); assuming API port ${portBackend} from backend/.env`);
} else {
  console.log(`[check:env] Ports aligned: backend PORT and frontend NEXT_PUBLIC_API_URL both use ${portBackend}`);
}

const healthPort = portBackend;
const healthPath = "/api/health";
const req = http.get({ hostname: "127.0.0.1", port: healthPort, path: healthPath, timeout: 5000 }, (res) => {
  let body = "";
  res.on("data", (c) => (body += c));
  res.on("end", () => {
    if (res.statusCode === 200) {
      console.log(`[check:env] API reachable at http://127.0.0.1:${healthPort}${healthPath}`);
      process.exit(ok ? 0 : 1);
    } else {
      console.error(`[check:env] API returned HTTP ${res.statusCode} on port ${healthPort}. Start the backend (npm run dev:backend).`);
      process.exit(1);
    }
  });
});
req.on("error", (e) => {
  console.error(`[check:env] Cannot reach API on port ${healthPort}: ${e.message}`);
  console.error("  Start the backend from the repo: npm run dev:backend");
  process.exit(1);
});
