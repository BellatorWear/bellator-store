import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { getCart } from "@/app/cart";
import CartClient from "./CartClient";

export default async function WarenkorbPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const cart = await getCart();
  return <CartClient initialCart={cart} />;
}
