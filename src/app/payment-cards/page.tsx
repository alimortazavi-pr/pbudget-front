import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { PaymentCardsPage } from "@/components/pages/payment-cards/PaymentCardsPage";

export default function Page() {
  return (
    <FeatureGate feature="payment_cards">
      <PaymentCardsPage />
    </FeatureGate>
  );
}
