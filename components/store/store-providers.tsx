"use client";

import { ToastProvider } from "@/components/ui/toast";

export function StoreProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
