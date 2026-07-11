import { getCurrentUser } from "@/app/actions";
import { getCart } from "@/app/cart";
import EngagementPopup from "./components/EngagementPopup";
import GlobalHeader from "@/app/components/GlobalHeader";
import GlobalFooter from "@/app/components/GlobalFooter";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const cart = await getCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col font-mono"
      style={{ backgroundImage: 'url("/background.webp")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      {user && (
        <EngagementPopup
          initialNewsletterOptIn={user.newsletterOptIn ?? false}
          initialPushEnabled={user.pushEnabled ?? false}
        />
      )}
      <div className="relative z-10 flex flex-col min-h-screen t-invert">
      <div className="absolute inset-0 bg-black/50 z-0 pointer-events-none" />
        <GlobalHeader />
        <main className="flex-grow">{children}</main>
        <GlobalFooter />
      </div>
    </div>
  );
}
