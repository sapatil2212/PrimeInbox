import { TransactionsClient } from "./transactions-client";

export const metadata = {
  title: "Transaction History | PrimeInbox Admin",
  description: "Complete invoice and payment transaction history",
};

export default function TransactionsPage() {
  return <TransactionsClient />;
}
