import GlobalHeader from "@/app/components/GlobalHeader";
import GlobalFooter from "@/app/components/GlobalFooter";
import { ReactNode } from "react";

export default function InfoPageLayout({ children, title, subtitle }: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col font-mono bg-black text-white"
      style={{ backgroundImage: 'url("/background.webp")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <div className="fixed inset-0 bg-black/70 z-0 pointer-events-none" />
      <div className="relative z-10 flex flex-col min-h-screen t-invert">
        <GlobalHeader />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-8 md:py-12">
          {title && (
            <div className="mb-8 pb-6 border-b border-zinc-800">
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">{title}</h1>
              {subtitle && <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
        <GlobalFooter />
      </div>
    </div>
  );
}
