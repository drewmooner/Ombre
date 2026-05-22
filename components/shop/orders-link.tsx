import Link from "next/link";
import { OrdersIcon } from "@/components/icons";

type OrdersLinkProps = {
  className: string;
  badgeClassName?: string;
  activeOrderCount?: number;
  signedIn: boolean;
};

export function OrdersLink({
  className,
  badgeClassName,
  activeOrderCount = 0,
  signedIn,
}: OrdersLinkProps) {
  const href = signedIn ? "/orders" : "/login?next=/orders";
  const badge = activeOrderCount > 0 ? activeOrderCount : 0;

  return (
    <Link
      href={href}
      prefetch={signedIn}
      className={className}
      aria-label={
        signedIn
          ? `Your orders${badge > 0 ? `, ${badge} in progress` : ""}`
          : "Sign in to view orders"
      }
    >
      <OrdersIcon className="h-5 w-5" />
      {badge > 0 ? (
        <span
          className={
            badgeClassName ??
            "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-[var(--on-accent)]"
          }
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
