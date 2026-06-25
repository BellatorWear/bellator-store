export default function ShopLoading() {
  return (
    <main className="flex justify-center p-6 md:p-16">
      <div className="w-full max-w-xl space-y-6">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-64 w-full" />
        <div className="skeleton h-10 w-2/3" />
        <div className="skeleton h-10 w-1/2" />
      </div>
    </main>
  );
}
