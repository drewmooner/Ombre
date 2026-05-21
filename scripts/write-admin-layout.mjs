import { writeFileSync } from "fs";
const d = "motionBar".replace("motionBar", "div");

writeFileSync(
  "app/admin/layout.tsx",
  `import { AdminNav } from "@/components/admin/admin-nav";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();

  return (
    <${d} className="page-ambient min-h-full">
      {authed && <AdminNav />}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</main>
    </${d}>
  );
}
`,
);
