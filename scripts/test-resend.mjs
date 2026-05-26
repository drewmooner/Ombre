import { readFileSync } from "fs";
import { Resend } from "resend";

const env = readFileSync(".env", "utf8");
const key = env.match(/RESEND_API_KEY="([^"]+)"/)?.[1];
const from =
  env.match(/RESEND_FROM_ORDERS="([^"]+)"/)?.[1] ??
  env.match(/RESEND_FROM="([^"]+)"/)?.[1] ??
  "0mbré Orders <orders@0mbre.shop>";

if (!key) {
  console.error("No RESEND_API_KEY in .env");
  process.exit(1);
}

console.log("Key prefix:", key.slice(0, 8) + "...");
console.log("From:", from);

const resend = new Resend(key);

try {
  const result = await resend.emails.send({
    from,
    to: ["delivered@resend.dev"],
    subject: "0mbré connectivity test",
    html: "<p>test</p>",
  });
  console.log("Result:", JSON.stringify(result, null, 2));
} catch (e) {
  console.error("Thrown:", e.message);
  if (e.cause) console.error("Cause:", e.cause);
}
