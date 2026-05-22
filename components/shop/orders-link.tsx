import Link from "next/link";
import { OrdersIcon } from "@/components/icons";
import { HeaderIconLabel } from "./header-icon-label";

type OrdersLinkProps = {
  className?: string;
  badgeClassName?: string;
  activeOrderCount?: number;
  signedIn: boolean;
  label?: string;
};

export function OrdersLink({
  className = "morph-btn site-header-action site-header-action--orders",
  badgeClassName,
  activeOrderCount = 0,
  signedIn,
  label = "Orders",
}: OrdersLinkProps) {
  const href = signedIn ? "/orders" : "/login?next=/orders";
  const badge = activeOrderCount > 0 ? activeOrderCount : 0;

  const badgeEl =
    badge > 0 ? (
      <span
        className={
          badgeClassName ??
          "site-header-action__badge"
        }
      >
        {badge > 9 ? "9+" : badge}
      </span>
    ) : null;

  return (
    <Link
      href={href}
      prefetch={signedIn}
      className={className}
      aria-label={
        signedIn
          ? `${label}${badge > 0 ? `, ${badge} in progress` : ""}`
          : `Sign in to view ${label.toLowerCase()}`
      }
    >
      <HeaderIconLabel label={label} badge={badgeEl}>
        <OrdersIcon className="h-5 w-5" />
      </HeaderIconLabel>
    </Link>
  );
}
