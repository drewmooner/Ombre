import { writeFileSync } from "fs";

const d = "d" + "iv";

writeFileSync(
  "app/store/layout.tsx",
  `import { StoreNav } from "@/components/store/store-nav";
import { isStoreAuthenticated } from "@/lib/store-auth";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isStoreAuthenticated();

  return (
    <${d} className="page-ambient store-shell min-h-full">
      {authed && <StoreNav />}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </${d}>
  );
}
`,
);
