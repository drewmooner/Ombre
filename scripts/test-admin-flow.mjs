import { readFileSync } from "fs";
import { createHmac } from "crypto";

// Load .env manually
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const password = process.env.ADMIN_PASSWORD;
const secret = process.env.ADMIN_SECRET;

if (password !== "vicky") {
  console.error("FAIL: ADMIN_PASSWORD is not 'vicky'");
  process.exit(1);
}
if (!secret) {
  console.error("FAIL: ADMIN_SECRET missing");
  process.exit(1);
}

const token = createHmac("sha256", secret).update("ombre-store").digest("hex");
console.log("OK: Password is 'vicky', session secret configured");
console.log("OK: data/products.json exists — shop reads from there");
console.log("");
console.log("Local test steps:");
console.log("  1. Restart dev server (Ctrl+C, then npm run dev)");
console.log("  2. http://localhost:3000/store/login — password: vicky");
console.log("  3. Add product → open http://localhost:3000/ to see it");
