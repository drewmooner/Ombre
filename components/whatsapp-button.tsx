"use client";

import { WhatsAppIcon } from "./icons";
import {
  WHATSAPP_DEFAULT_MESSAGE,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";

type WhatsAppButtonProps = {
  message?: string;
};

export function WhatsAppButton({
  message = WHATSAPP_DEFAULT_MESSAGE,
}: WhatsAppButtonProps) {
  return (
    <a
      href={buildWhatsAppUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="morph-btn-primary fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
      aria-label="Customer support on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7 text-[var(--on-accent)]" />
    </a>
  );
}
