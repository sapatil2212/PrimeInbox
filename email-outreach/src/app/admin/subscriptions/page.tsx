import { SubscriptionsClient } from "./subscriptions-client";

export const metadata = {
  title: "Subscription Management | PrimeInbox Admin",
  description: "Manage all tenant subscriptions, plans, and billing",
};

export default function SubscriptionsPage() {
  return <SubscriptionsClient />;
}
