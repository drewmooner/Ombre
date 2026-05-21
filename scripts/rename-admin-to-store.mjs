import { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync, rmSync } from "fs";
import { join } from "path";

const replacements = [
  [/\@\/lib\/admin-auth/g, "@/lib/store-auth"],
  [/\@\/lib\/admin\/actions/g, "@/lib/store/actions"],
  [/\@\/components\/admin\//g, "@/components/store/"],
  [/\/admin\/products/g, "/store/products"],
  [/\/admin\/login/g, "/store/login"],
  [/\/admin"/g, '/store"'],
  [/\/admin`/g, "/store`"],
  [/\/admin\b/g, "/store"],
  [/admin-nav/g, "store-nav"],
  [/AdminNav/g, "StoreNav"],
  [/AdminLoginForm/g, "StoreLoginForm"],
  [/login-form/g, "login-form"],
  [/loginAdmin/g, "loginStore"],
  [/logoutAdmin/g, "logoutStore"],
  [/requireAdminAction/g, "requireStoreAction"],
  [/requireAdmin\b/g, "requireStore"],
  [/isAdminAuthenticated/g, "isStoreAuthenticated"],
  [/createAdminSession/g, "createStoreSession"],
  [/destroyAdminSession/g, "destroyStoreSession"],
  [/verifyAdminPassword/g, "verifyStorePassword"],
  [/ombre-admin-session/g, "ombre-store-session"],
  [/ombre-admin"/g, 'ombre-store"'],
  [/AdminLayout/g, "StoreLayout"],
  [/AdminLoginPage/g, "StoreLoginPage"],
  [/AdminProductsPage/g, "StoreProductsPage"],
  [/AdminPage\b/g, "StorePage"],
  [/NewProductPage/g, "NewProductPage"],
  [/Ombré Admin/g, "Ombré Store"],
  [/>Admin</g, ">Store<"],
  [/Sign in to manage/g, "Sign in to manage"],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(p, files);
    } else if (/\.(tsx?|mjs)$/.test(name)) {
      files.push(p);
    }
  }
  return files;
}

const targets = ["app/store", "components/store", "lib/store", "lib/store-auth.ts", "scripts/test-admin-flow.mjs"];

for (const target of targets) {
  const files = statSync(target).isDirectory() ? walk(target) : [target];
  for (const file of files) {
    let content = readFileSync(file, "utf8");
    if (!content.includes("admin") && !content.includes("Admin")) continue;
    for (const [from, to] of replacements) {
      content = content.replace(from, to);
    }
    writeFileSync(file, content);
  }
}

// Rename admin-nav.tsx -> store-nav.tsx if needed
try {
  const navOld = "components/store/admin-nav.tsx";
  const navNew = "components/store/store-nav.tsx";
  writeFileSync(navNew, readFileSync(navOld, "utf8"));
  unlinkSync(navOld);
} catch {
  /* already renamed */
}

// Remove old admin paths
for (const p of ["app/admin", "components/admin", "lib/admin", "lib/admin-auth.ts"]) {
  try {
    rmSync(p, { recursive: true, force: true });
  } catch {
    /* */
  }
}

console.log("Done: /admin -> /store");
