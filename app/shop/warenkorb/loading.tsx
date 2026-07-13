// Kein eigenes Hintergrundbild/Overlay hier - app/shop/layout.tsx zeichnet
// das für alle /shop/*-Routen (inkl. dieser) bereits korrekt, inklusive
// separater Overlay-Ebene statt eines Filters. Ein zweites, eigenes
// Hintergrundbild mit filter: brightness() hier drüber war genau der Bug
// (verdunkelte den gesamten Skeleton-Inhalt mit).
export default function WarenkorbLoading() {
  return (
    <main className="min-h-screen flex justify-center p-6 md:p-16">
      <div className="w-full max-w-xl space-y-4">
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    </main>
  );
}
