export default function AdminLoading() {
  return (
    <main className="min-h-screen relative" style={{ backgroundImage: 'url("/background.webp")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <div className="absolute inset-0 bg-black/35 pointer-events-none z-0" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-6 py-8 space-y-8">
        <div className="skeleton h-14 w-1/2" />
        <div className="skeleton h-12 w-full" />
        <div className="space-y-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      </div>
    </main>
  );
}
