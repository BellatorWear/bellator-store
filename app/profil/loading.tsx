export default function ProfilLoading() {
  return (
    <main className="min-h-screen relative" style={{ backgroundImage: 'url("/background.webp")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <div className="absolute inset-0 bg-black/35 pointer-events-none z-0" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-20 w-full lg:col-span-2" />
          <div className="skeleton h-40 w-full" />
          <div className="skeleton h-40 w-full" />
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-24 w-full lg:col-span-2" />
        </div>
      </div>
    </main>
  );
}
