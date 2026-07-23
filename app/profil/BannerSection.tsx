"use client";
import { useState } from "react";
import BannerEditor from "./BannerEditor";

export default function BannerSection({ bannerUrl }: { bannerUrl: string | null }) {
  const [editing, setEditing] = useState(!bannerUrl);

  return (
    <div className="t-card border p-4 mb-6 [column-span:all] space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xs font-bold uppercase tracking-widest t-muted">Profilbanner</h2>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-[10px] border t-border px-3 py-1.5 uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-200 active:scale-[0.97]"
        >
          {editing ? "Vorschau" : "Banner bearbeiten"}
        </button>
      </div>

      {editing ? (
        <BannerEditor initialBannerUrl={bannerUrl} />
      ) : bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt="Profilbanner" className="w-full aspect-[4/1] object-cover border t-border" />
      ) : (
        <div className="w-full aspect-[4/1] border t-border flex items-center justify-center text-xs t-muted uppercase tracking-widest">
          Noch kein Banner
        </div>
      )}
    </div>
  );
}
