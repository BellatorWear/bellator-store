export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-black p-4 sm:p-8 space-y-4 max-w-3xl mx-auto">
      <div className="skeleton h-10 w-1/2" />
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-24 w-full" />
    </main>
  );
}
