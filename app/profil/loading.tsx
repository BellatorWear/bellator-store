export default function ProfilLoading() {
  return (
    <main className="min-h-screen relative site-bg">
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="columns-1 lg:columns-2 gap-6">
          <div className="skeleton h-20 w-full mb-6 [column-span:all]" />
          <div className="skeleton h-40 w-full mb-6 break-inside-avoid-column" />
          <div className="skeleton h-32 w-full mb-6 break-inside-avoid-column" />
          <div className="skeleton h-28 w-full mb-6 break-inside-avoid-column" />
          <div className="skeleton h-36 w-full mb-6 break-inside-avoid-column" />
          <div className="skeleton h-32 w-full mb-6 break-inside-avoid-column" />
          <div className="skeleton h-24 w-full mb-6 break-inside-avoid-column" />
          <div className="skeleton h-24 w-full [column-span:all]" />
        </div>
      </div>
    </main>
  );
}
