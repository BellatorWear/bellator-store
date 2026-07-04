import Link from "next/link";
import { getCurrentUser } from "@/app/actions";
import { getCart } from "@/app/cart";
import HamburgerNav from "./HamburgerNav";

export default async function GlobalHeader() {
  const user = await getCurrentUser();
  let cartCount = 0;
  try {
    const cart = await getCart();
    cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  } catch {
    // Gast ohne Cookie hat noch keinen Warenkorb
  }

  return (
    <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between font-mono">
      <Link href="/" className="text-xl font-black uppercase tracking-tighter italic text-white hover:opacity-70 transition">
        BELLATOR.
      </Link>
      <HamburgerNav
        cartCount={cartCount}
        isAdmin={user?.isAdmin ?? false}
        username={user?.username ?? null}
      />
    </header>
  );
}
