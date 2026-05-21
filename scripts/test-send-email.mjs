import { readFileSync } from "fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[line.slice(0, i)] = v;
}

const { sendOtpEmail } = await import("../lib/email/send-email.ts");
console.log("Sending test OTP email…");
const result = await sendOtpEmail("delivered@resend.dev", "123456");
console.log(JSON.stringify(result, null, 2));
