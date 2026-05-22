import {
  LegalDocument,
  LegalSection,
} from "@/components/legal/legal-document";

export const metadata = {
  title: "Privacy Policy — Ombré",
  description: "How Ombré handles your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument title="Privacy Policy" updated="20 May 2026">
      <LegalSection title="What Ombré collects">
        <p>When you use the Ombré shop, Ombré collects:</p>
        <ul>
          <li>Your email (sign-in and order updates)</li>
          <li>Name, phone, address, state, and delivery choice at checkout</li>
          <li>Order details, payment status, and Paystack payment reference</li>
        </ul>
        <p>Ombré does not sell your data for advertising.</p>
      </LegalSection>

      <LegalSection title="What Ombré uses it for">
        <ul>
          <li>Sign you in and process your orders</li>
          <li>Send payment links, receipts, and order updates by email</li>
          <li>Deliver your items and answer support on WhatsApp</li>
          <li>Stop fraud and fix checkout errors</li>
        </ul>
      </LegalSection>

      <LegalSection title="Who Ombré works with">
        <p>Ombré shares only what is needed with:</p>
        <ul>
          <li>
            <strong>Paystack</strong> — payments (card details stay with Paystack)
          </li>
          <li>
            <strong>Resend</strong> — order emails
          </li>
          <li>
            <strong>Supabase</strong> — orders and product images
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For privacy requests, message Ombré on WhatsApp from the website or use
          the email on your account.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
