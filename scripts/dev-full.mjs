import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
if (!existsSync("backend/vendor/autoload.php")) {
  console.error(
    "Cần chạy composer install trong backend và php artisan migrate trước. Xem docs/LARAVEL_PORTALS.md.",
  );
  process.exit(1);
}
const php = process.env.PHP_BINARY || "php";
const api = spawn(
  php,
  ["-S", "127.0.0.1:8787", "-t", "backend/public", "backend/server.php"],
  { stdio: "inherit", env: process.env },
);
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
for (const child of [api, vite]) {
  child.on("error", (e) => {
    console.error(e.message);
    stop(1);
  });
  child.on("exit", (code) => stop(code || 0));
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());
