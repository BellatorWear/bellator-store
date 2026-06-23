import { getCurrentUser } from "@/app/actions";
import { db } from "@/db";
import { challenges, userChallenges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function ChallengesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const allChallenges = await db
    .select()
    .from(challenges)
    .where(eq(challenges.active, true));
  const completed = await db
    .select()
    .from(userChallenges)
    .where(eq(userChallenges.userId, user.id));
  const completedIds = new Set(completed.map((c) => c.challengeId));

  return (
    <main className="flex justify-center p-6 md:p-16">
      <div className="w-full max-w-xl space-y-8">
        <div className="bg-black/80 p-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">
            Challenges
          </h1>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Sammle Punkte durch Aktionen
          </p>
        </div>

        <div className="border border-zinc-700 bg-black/80 p-4 flex justify-between items-center">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">
            Deine Punkte
          </span>
          <span className="text-yellow-400 font-bold text-xl">
            {user.points} Pkt.
          </span>
        </div>

        <div className="space-y-4">
          {allChallenges.map((challenge) => {
            const done = completedIds.has(challenge.id);
            return (
              <div
                key={challenge.id}
                className={`border p-6 ${done ? "border-yellow-800 bg-yellow-900/10" : "border-zinc-700 bg-black/80"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2
                      className={`text-sm font-bold uppercase tracking-widest mb-1 ${done ? "text-yellow-400" : "text-white"}`}
                    >
                      {done ? "✓ " : ""}
                      {challenge.title}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      {challenge.description}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ml-4 whitespace-nowrap ${done ? "text-yellow-400" : "text-zinc-400"}`}
                  >
                    +{challenge.pointReward} Pkt.
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
