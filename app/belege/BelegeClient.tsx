"use client";
import { useState } from "react";
import { handleAction } from "@/app/actions";

type OrderItem = {
  id: number;
  productName: string;
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  total: number;
  status: string | null;
  createdAt: Date | null;
  items: OrderItem[];
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });
  } catch { return "—"; }
}

function formatEuro(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function BelegView({ order, userEmail }: { order: Order; userEmail: string }) {
  return (
    <div className="border border-zinc-700 bg-black p-8 font-mono text-sm" id={`beleg-${order.id}`}>
      <div className="border-b border-zinc-600 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">BELLATOR.</h2>
          <p className="text-xs text-zinc-500 mt-1">Bellator Streetwear</p>
        </div>
        <div className="text-right text-xs text-zinc-400">
          <p className="uppercase tracking-widest">Beleg #{order.id}</p>
          <p className="mt-1">{formatDate(order.createdAt)}</p>
        </div>
      </div>
      <div className="mb-6">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Kunde</p>
        <p>{userEmail}</p>
      </div>
      <table className="w-full text-xs mb-6">
        <thead>
          <tr className="border-b border-zinc-700 text-zinc-400 uppercase tracking-widest">
            <th className="text-left pb-2">Artikel</th>
            <th className="text-center pb-2">Menge</th>
            <th className="text-right pb-2">Preis</th>
            <th className="text-right pb-2">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          {order.items.length === 0 ? (
            <tr><td colSpan={4} className="py-4 text-zinc-600 text-center">Keine Artikel</td></tr>
          ) : order.items.map(item => (
            <tr key={item.id} className="border-b border-zinc-800">
              <td className="py-2">{item.productName}</td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right">{formatEuro(item.price)}</td>
              <td className="py-2 text-right">{formatEuro(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-zinc-600 pt-4 flex justify-between items-center">
        <span className="text-xs text-zinc-400 uppercase tracking-widest">Gesamtbetrag</span>
        <span className="text-lg font-bold">{formatEuro(order.total)}</span>
      </div>
      <div className="mt-6 text-xs text-zinc-600 border-t border-zinc-800 pt-4">
        <p>Status: <span className="uppercase">{order.status}</span></p>
        <p className="mt-1">© {new Date().getFullYear()} Bellator Streetwear</p>
      </div>
    </div>
  );
}

export default function BelegeClient({ orders, userEmail }: { orders: Order[]; userEmail: string }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const fd = new FormData();
    fd.append("actionType", "verifyPassword");
    fd.append("password", password);
    const res = await handleAction(fd);
    setLoading(false);
    if (res.error) { setErr(res.error); return; }
    setUnlocked(true);
  }

  function downloadBeleg(order: Order) {
    const content = `BELLATOR STREETWEAR
Beleg #${order.id}
Datum: ${formatDate(order.createdAt)}
Kunde: ${userEmail}

ARTIKEL:
${order.items.map(i => `${i.productName} x${i.quantity} — ${formatEuro(i.price * i.quantity)}`).join("\n")}

GESAMT: ${formatEuro(order.total)}
Status: ${order.status?.toUpperCase()}

© ${new Date().getFullYear()} Bellator Streetwear`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bellator-beleg-${order.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!unlocked) {
    return (
      <div className="flex justify-center p-6 md:p-16">
        <div className="w-full max-w-sm border border-zinc-700 bg-black/80 p-8">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Meine Belege</h1>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6">
            Gib dein Passwort ein um deine Belege einzusehen.
          </p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="PASSWORT"
              required
              className="w-full bg-zinc-900 border-b border-zinc-600 p-2 focus:border-white outline-none transition text-center placeholder:text-zinc-600 text-white"
            />
            {err && <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">{err}</p>}
            <button type="submit" disabled={loading}
              className="w-full border border-zinc-500 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50">
              {loading ? "..." : "Entsperren"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-6 md:p-16">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-black/80 p-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">Meine Belege</h1>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">{orders.length} Bestellung{orders.length !== 1 ? "en" : ""}</p>
        </div>

        {orders.length === 0 ? (
          <div className="border border-zinc-700 bg-black/80 p-8 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Noch keine Bestellungen vorhanden.</p>
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="border border-zinc-700 bg-black/80">
            <div
              className="p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-900 transition"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div>
                <p className="text-sm uppercase tracking-widest font-bold">Bestellung #{order.id}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold">{formatEuro(order.total)}</span>
                <span className="text-zinc-500">{expandedOrder === order.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {expandedOrder === order.id && (
              <div className="border-t border-zinc-800 p-4 space-y-4">
                <BelegView order={order} userEmail={userEmail} />
                <button
                  onClick={() => downloadBeleg(order)}
                  className="w-full border border-zinc-500 py-2 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition font-bold"
                >
                  ↓ Beleg herunterladen (.txt)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
