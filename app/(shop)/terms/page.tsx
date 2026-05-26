import {
  LegalDocument,
  LegalSection,
} from "@/components/legal/legal-document";

export const metadata = {
  title: "Terms of Service — 0mbré",
  description: "Terms for shopping with 0mbré.",
};

export default function TermsOfServicePage() {
  return (
    <LegalDocument title="Terms of Service" updated="20 May 2026">
      <LegalSection title="Using the shop">
        <p>
          By shopping on 0mbré, you accept these terms. If you do not accept them,
          do not place an order.
        </p>
        <p>
          All prices are in NGN. 0mbré can change prices and stock without notice.
          0mbré will cancel orders that are mispriced, out of stock, or fraudulent
          and refund any payment taken.
        </p>
      </LegalSection>

      <LegalSection title="Orders and payment">
        <p>
          You must sign in with email to checkout. 0mbré reserves stock for a set
          time while you pay on Paystack. Your order is confirmed only after
          payment succeeds. Unpaid orders expire and the items go back on sale.
        </p>
        <p>
          Enter correct delivery details. 0mbré is not responsible for failed
          delivery caused by wrong addresses or phone numbers.
        </p>
      </LegalSection>

      <LegalSection title="Delivery">
        <p>
          0mbré offers <strong>Door step</strong> delivery within Akwa Ibom and{" "}
          <strong>Park</strong> delivery for other states.
        </p>
        <p>
          Delivery is typically 3–7 days after payment is confirmed. Delivery fee
          is not fixed at checkout and will be confirmed with you on WhatsApp
          after payment based on your location and delivery method.
        </p>
      </LegalSection>

      <LegalSection title="Returns">
        <p>
          0mbré accepts returns only for damaged, faulty, or wrong items. Message
          0mbré on WhatsApp within 48 hours of delivery with photos and your order
          reference. Approved refunds go back via Paystack. Confirmed delivery
          fees are not refunded unless 0mbré made the error.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions? Message 0mbré on WhatsApp from the website.</p>
      </LegalSection>
    </LegalDocument>
  );
}
