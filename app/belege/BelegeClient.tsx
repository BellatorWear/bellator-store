"use client";
import { useState } from "react";
import { handleAction } from "@/app/actions";
import { Eye, EyeOff } from "lucide-react";

type OrderItem = { id: number; productName: string; price: number; quantity: number };
type Order = { id: number; total: number; status: string | null; createdAt: Date | null; items: OrderItem[] };

function formatDate(date: Date | null) {
  if (!date) return "—";
  try { return new Date(date).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return "—"; }
}
function formatEuro(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function BelegView({ order, userEmail }: { order: Order; userEmail: string }) {
  return (
    <div className="border t-border bg-black p-5 sm:p-8 font-mono text-sm">
      <div className="border-b t-border pb-4 mb-6 flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">BELLATOR.</h2>
          <p className="text-xs t-muted mt-1">Bellator Streetwear</p>
        </div>
        <div className="text-right text-xs t-muted">
          <p className="uppercase tracking-widest">Beleg #{order.id}</p>
          <p className="mt-1">{formatDate(order.createdAt)}</p>
        </div>
      </div>
      <div className="mb-6">
        <p className="text-xs t-muted uppercase tracking-widest mb-1">Kunde</p>
        <p className="break-all">{userEmail}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs mb-6 min-w-[300px]">
          <thead>
            <tr className="border-b t-border t-muted uppercase tracking-widest">
              <th className="text-left pb-2">Artikel</th>
              <th className="text-center pb-2">Menge</th>
              <th className="text-right pb-2">Preis</th>
              <th className="text-right pb-2">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {order.items.length === 0 ? (
              <tr><td colSpan={4} className="py-4 t-faint text-center">Keine Artikel</td></tr>
            ) : order.items.map(item => (
              <tr key={item.id} className="border-b t-border-s">
                <td className="py-2">{item.productName}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">{formatEuro(item.price)}</td>
                <td className="py-2 text-right">{formatEuro(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t t-border pt-4 flex justify-between items-center">
        <span className="text-xs t-muted uppercase tracking-widest">Gesamtbetrag</span>
        <span className="text-lg font-bold">{formatEuro(order.total)}</span>
      </div>
      <div className="mt-6 text-xs t-faint border-t t-border-s pt-4">
        <p>Status: <span className="uppercase">{order.status}</span></p>
        <p className="mt-1">© {new Date().getFullYear()} Bellator Streetwear</p>
      </div>
    </div>
  );
}

export default function BelegeClient({ orders, userEmail }: { orders: Order[]; userEmail: string }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    const content = `BELLATOR STREETWEAR\nBeleg #${order.id}\nDatum: ${formatDate(order.createdAt)}\nKunde: ${userEmail}\n\nARTIKEL:\n${order.items.map(i => `${i.productName} x${i.quantity} — ${formatEuro(i.price * i.quantity)}`).join("\n")}\n\nGESAMT: ${formatEuro(order.total)}\nStatus: ${order.status?.toUpperCase()}\n\n© ${new Date().getFullYear()} Bellator Streetwear`;
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
      <div className="flex justify-center p-4 sm:p-6 md:p-16">
        <div className="w-full max-w-sm t-card border p-6 sm:p-8">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2 t-text">Meine Belege</h1>
          <p className="text-xs t-muted uppercase tracking-widest mb-6">
            Gib dein Passwort ein um deine Belege einzusehen.
          </p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="pw-wrap">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="PASSWORT"
                required
                className="w-full t-input border-b p-2 focus:border-white outline-none transition text-center text-sm tracking-widest"
              />
              <button type="button" className="pw-eye" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {err && <p className="text-red-500 text-[10px] uppercase tracking-widest text-center">{err}</p>}
            <button type="submit" disabled={loading}
              className="w-full border t-border py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50 t-text">
              {loading ? "..." : "Entsperren"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4 sm:p-6 md:p-16">
      <div className="w-full max-w-2xl space-y-6">
        <div className="t-card border p-4">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-1 t-text">Meine Belege</h1>
          <p className="text-xs t-muted uppercase tracking-widest">{orders.length} Bestellung{orders.length !== 1 ? "en" : ""}</p>
        </div>

        {orders.length === 0 ? (
          <div className="t-card border p-8 text-center">
            <p className="text-xs t-muted uppercase tracking-widest">Noch keine Bestellungen vorhanden.</p>
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="t-card border">
            <div className="p-4 flex justify-between items-center cursor-pointer hover:opacity-80 transition"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
              <div>
                <p className="text-sm uppercase tracking-widest font-bold t-text">Bestellung #{order.id}</p>
                <p className="text-xs t-muted mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="font-bold t-text">{formatEuro(order.total)}</span>
                <span className="t-muted">{expandedOrder === order.id ? "▲" : "▼"}</span>
              </div>
            </div>
            {expandedOrder === order.id && (
              <div className="border-t t-border-s p-4 space-y-4">
                <BelegView order={order} userEmail={userEmail} />
                <button onClick={() => downloadBeleg(order)}
                  className="w-full border t-border py-2 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition font-bold t-text">
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
