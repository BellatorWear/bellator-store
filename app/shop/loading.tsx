export default function ShopLoading() {
  return (
    <main className="min-h-screen px-4 pt-4 pb-12 md:pt-6 md:pb-16">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="skeleton h-16 w-full max-w-[380px] mx-auto" />
        <div className="flex gap-3 justify-center">
          <div className="skeleton h-8 w-20" />
          <div className="skeleton h-8 w-20" />
          <div className="skeleton h-8 w-20" />
        </div>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton aspect-[3/4] w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
