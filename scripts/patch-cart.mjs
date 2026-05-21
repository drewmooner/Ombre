import { readFileSync, writeFileSync } from "fs";

const d = "div";
const file = "app/(shop)/cart/page.tsx";
let s = readFileSync(file, "utf8");

const qtyBlock = `
              <${d} className="mt-3 flex items-center justify-between gap-3">
                <${d} className="morph-btn flex items-center rounded-full">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="flex h-9 w-9 items-center justify-center text-lg"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-[2ch] text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="flex h-9 w-9 items-center justify-center text-lg"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </${d}>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Remove
                </button>
              </${d}>
`;

const checkoutBlock = `
      <${d} className="morph-surface mt-8 rounded-2xl p-6">
        <${d} className="flex items-center justify-between text-lg font-semibold">
          <span>Subtotal</span>
          <span>{formatNaira(subtotal)}</span>
        </${d}>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Shipping calculated at checkout · Nigeria delivery only
        </p>

        <MorphButton
          href={checkoutUrl}
          variant="primary"
          fullWidth
          className="mt-6 py-3.5"
        >
          Complete order on WhatsApp
        </MorphButton>

        <MorphButton href="/" fullWidth className="mt-3">
          Continue shopping
        </MorphButton>
      </${d}>
`;

s = s.replace(/<div \/>\s*\n\s*<\/div>/, qtyBlock.trim());
s = s.replace("PLACEHOLDER_CHECKOUT", checkoutBlock.trim());
s = s.replace(/<div \/>\s*\n\s*<\/motionBar>/, qtyBlock.trim());

writeFileSync(file, s);
