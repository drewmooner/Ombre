import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "default" | "primary" | "ghost";

const variantClass: Record<Variant, string> = {
  default: "morph-btn text-[var(--foreground)]",
  primary: "morph-btn morph-btn-primary",
  ghost:
    "border border-transparent bg-transparent shadow-none hover:bg-white/25",
};

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  fullWidth?: boolean;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = BaseProps & {
  href: string;
};

export function MorphButton({
  children,
  variant = "default",
  className = "",
  fullWidth,
  ...props
}: ButtonProps | LinkProps) {
  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium tracking-wide",
    variantClass[variant],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href) {
    const { href, ...rest } = props;
    const isExternal = href.startsWith("http");
    if (isExternal) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { href: _, type = "button", ...buttonProps } = props as ButtonProps;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
