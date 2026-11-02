import { spawn } from "node:child_process";
const api = spawn(process.execPath, ["server/index.mjs", "--dev"], {
  stdio: "inherit",
  env: { ...process.env, PORT: "8787" },
});
const vite = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env },
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill();
  vite.kill();
  setTimeout(() => process.exit(code), 300).unref();
}
api.on("exit", (code) => stop(code || 0));
vite.on("exit", (code) => stop(code || 0));
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => stop());
