import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
const source = "dist",
  target = "backend/public";
if (!existsSync(join(source, "index.html")))
  throw Error("Chạy npm run build trước.");
mkdirSync(target, { recursive: true });
// Only generated assets are replaced. Laravel entry/rewrite and storage uploads stay intact.
rmSync(join(target, "assets"), { recursive: true, force: true });
for (const item of readdirSync(source)) {
  if (
    ["index.html", "index.php", ".htaccess", "storage", "uploads"].includes(
      item,
    )
  )
    continue;
  cpSync(join(source, item), join(target, item), { recursive: true });
}
writeFileSync(
  join(target, "spa.html"),
  readFileSync(join(source, "index.html")),
);
console.log(
  "Frontend copied to backend/public; Laravel index.php and .htaccess preserved.",
);
