import Link from "next/link";
import { redirect } from "next/navigation";
import { isStoreAuthenticated } from "@/lib/store-auth";
import { StoreLoginForm } from "@/components/store/login-form";

export default async function StoreLoginPage() {
  if (await isStoreAuthenticated()) {
    redirect("/store/products");
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <StoreLoginForm />
      <Link href="/" className="link-accent mt-8 text-sm text-[var(--muted)]">
        ← Back to shop
      </Link>
    </div>
  );
}
