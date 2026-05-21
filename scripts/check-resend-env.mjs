import { readFileSync, existsSync } from "fs";

const envPath = ".env";
if (!existsSync(envPath)) {
  console.log("MISSING: .env file");
  process.exit(1);
}

const raw = readFileSync(envPath, "utf8");
const lines = raw.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));

for (const line of lines) {
  const i = line.indexOf("=");
  if (i < 0) continue;
  const key = line.slice(0, i).trim();
  if (!key.startsWith("RESEND")) continue;
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (key === "RESEND_API_KEY") {
    console.log(`RESEND_API_KEY: ${v ? `set (${v.slice(0, 7)}…, len ${v.length})` : "EMPTY"}`);
  } else if (key === "RESEND_FROM") {
    console.log(`RESEND_FROM: ${v || "EMPTY"}`);
  } else {
    console.log(`${key}: set`);
  }
}
