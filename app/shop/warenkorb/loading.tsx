export default function WarenkorbLoading() {
  return (
    <main className="min-h-screen flex justify-center p-6 md:p-16" style={{ backgroundImage: 'url("/background.webp")', backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", filter: "brightness(0.85)" }}>
      <div className="w-full max-w-xl space-y-4">
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    </main>
  );
}
