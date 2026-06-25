import { getCart } from "@/app/cart";
import CartClient from "./CartClient";

export default async function WarenkorbPage() {
  const cart = await getCart();
  return <CartClient initialCart={cart} />;
}
