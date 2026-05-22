import Link from "next/link";
import type { ReactNode } from "react";

type LegalDocumentProps = {
  title: string;
  updated: string;
  children: ReactNode;
};

export function LegalDocument({ title, updated, children }: LegalDocumentProps) {
  return (
    <article className="legal-page">
      <div className="legal-page__inner">
        <header className="legal-page__header">
          <Link href="/" className="legal-page__back link-accent">
            ← Back to shop
          </Link>
          <h1 className="legal-page__title">{title}</h1>
          <p className="legal-page__updated">Last updated {updated}</p>
        </header>
        <div className="legal-page__body morph-surface">{children}</div>
      </div>
    </article>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="legal-section">
      <h2 className="legal-section__title">{title}</h2>
      <div className="legal-section__content">{children}</div>
    </section>
  );
}
