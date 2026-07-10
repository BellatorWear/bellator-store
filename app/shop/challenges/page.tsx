import { getCurrentUser } from "@/app/actions";
import { db } from "@/db";
import { challenges, userChallenges, rewards, userRewards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import RedeemRewardButton from "./RedeemRewardButton";

// Alle Challenge-Typen werden automatisch geprüft (über Stripe-Webhook,
// Login, Einstellungen etc.). Es gibt keinen "Als erledigt markieren"-
// Button mehr, weil Punkte direkt in Rabattcodes umwandelbar sind.
// Die discord_join/review/referral Challenges sind per Migration deaktiviert.

export default async function ChallengesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const allChallenges = await db.select().from(challenges).where(eq(challenges.active, true));
  const completed = await db.select().from(userChallenges).where(eq(userChallenges.userId, user.id));
  const completedIds = new Set(completed.map(c => c.challengeId));

  const allRewards = await db.select().from(rewards).where(eq(rewards.active, true));
  const redeemed = await db.select().from(userRewards).where(eq(userRewards.userId, user.id));
  const redeemedCountByReward = new Map<number, number>();
  for (const r of redeemed) {
    if (!r.rewardId) continue;
    redeemedCountByReward.set(r.rewardId, (redeemedCountByReward.get(r.rewardId) ?? 0) + 1);
  }

  const done = allChallenges.filter(c => completedIds.has(c.id));
  const pending = allChallenges.filter(c => !completedIds.has(c.id));

  return (
      <div className="flex-1 flex justify-center px-4 sm:px-8 py-8">
      <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl space-y-8">
        <div className="t-card border p-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1 t-text">Challenges & Punkte</h1>
          <p className="text-xs t-muted uppercase tracking-widest">Sammle Punkte durch Aktionen und löse sie für Prämien ein</p>
        </div>

        <div className="t-card border p-4 flex justify-between items-center">
          <span className="text-xs t-muted uppercase tracking-widest">Deine Punkte</span>
          <span className="text-yellow-400 font-bold text-xl">{user.points} Pkt.</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-start">
        <div className="space-y-8">
        {/* Offene Challenges */}
        {pending.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest t-text bg-black/80 border border-zinc-800 px-4 py-2 inline-block">Offen</h2>
            {pending.map(challenge => (
              <div key={challenge.id} className="border t-border t-card p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-1 t-text">{challenge.title}</h3>
                    <p className="text-xs t-muted">{challenge.description}</p>
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap text-yellow-400">+{challenge.pointReward} Pkt.</span>
                </div>
                <p className="mt-3 text-[10px] t-faint uppercase tracking-widest">Wird automatisch erkannt</p>
              </div>
            ))}
          </section>
        )}
        </div>

        <div className="space-y-8">
        {/* Erledigte Challenges */}
        {done.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-yellow-400 bg-black/80 border border-yellow-900 px-4 py-2 inline-block">Erledigt</h2>
            {done.map(challenge => (
              <div key={challenge.id} className="border border-yellow-800 bg-yellow-900/10 p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-1 text-yellow-400">✓ {challenge.title}</h3>
                    <p className="text-xs t-muted">{challenge.description}</p>
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap text-yellow-400">+{challenge.pointReward} Pkt.</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Prämien */}
        <section className="space-y-4">
          <div className="bg-black/80 border border-zinc-800 px-4 py-3 flex items-center">
            <h2 className="text-xs font-bold uppercase tracking-widest t-text">Prämien einlösen</h2>
          </div>
          <p className="text-xs t-muted bg-black/80 border border-zinc-800 px-4 py-3">
            Tausche deine Punkte gegen Prämien — kein echtes Geld, nur Bellator-Vorteile.
          </p>
          {allRewards.map(reward => {
            const affordable = user.points >= reward.costPoints;
            const timesRedeemed = redeemedCountByReward.get(reward.id) ?? 0;
            const alreadyHasBadge = reward.type === "badge" && timesRedeemed > 0;
            return (
              <div key={reward.id} className="border t-border t-card p-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-1 t-text">{reward.title}</h3>
                    <p className="text-xs t-muted">{reward.description}</p>
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap t-muted">{reward.costPoints} Pkt.</span>
                </div>
                <div className="mt-4">
                  {alreadyHasBadge ? (
                    <p className="text-[10px] text-yellow-400 uppercase tracking-widest">✓ Bereits freigeschaltet</p>
                  ) : (
                    <RedeemRewardButton rewardId={reward.id} disabled={!affordable} />
                  )}
                </div>
              </div>
            );
          })}
        </section>
        </div>
        </div>
      </div>
      </div>
  );
}
