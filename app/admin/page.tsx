import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { db } from "@/db";
import { products, productVariants, productColors, users, newsPosts, preReleaseCodes, preReleaseRedemptions, pageViews, emailLog, homePosts } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import GlobalHeader from "@/app/components/GlobalHeader";
import GlobalFooter from "@/app/components/GlobalFooter";
import NewProductForm from "./NewProductForm";
import ProductRow from "./ProductRow";
import CountdownConfig from "./CountdownConfig";
import ExclusiveCodeConfig from "./ExclusiveCodeConfig";
import NewsChannel from "./NewsChannel";
import UserSearch from "./UserSearch";
import BlobStatus from "./BlobStatus";
import PreReleaseCodeManager from "./PreReleaseCodeManager";
import EmailLogViewer from "./EmailLogViewer";
import HomePostManager from "./HomePostManager";
import AdminDashboard, { type AdminFunctionGroup } from "./AdminDashboard";
import { publishDueScheduledPosts } from "@/app/utils/publishScheduled";
import RoleManager from "./RoleManager";
import TeamChatAccess from "./TeamChatAccess";
import { CHAT_ROLE_ACCESS_DEFAULT, type AdminSectionId } from "./permissions";
import { getAllRoles, getRoleConfig } from "./roles";
import { getSetting, COUNTDOWN_KEY, COUNTDOWN_DEFAULT, EXCLUSIVE_CODE_KEY, EXCLUSIVE_CODE_DEFAULT, CHAT_ROLE_ACCESS_KEY } from "@/app/utils/settings";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.role && !user.isAdmin) redirect("/shop");
  const roleName: string | null = user.isAdmin ? "admin" : user.role;
  if (!roleName) redirect("/shop");
  const [roleConfig, allRoles] = await Promise.all([getRoleConfig(user.role), getAllRoles()]);
  // Volle Admins dürfen immer, auch falls die "admin"-Rollen-Konfiguration
  // aus der DB fehlen sollte. Für alle anderen: die Rolle muss tatsächlich
  // (noch) existieren, sonst raus - z.B. falls eine Rolle gelöscht wurde.
  if (!user.isAdmin && !roleConfig) redirect("/shop");

  await publishDueScheduledPosts();

  const [allProducts, allVariants, allColors, userCountResult, countdown, exclusiveCode, recentPosts, allPreReleaseCodes, allPreReleaseRedemptions, viewCountResult, emailEntries, homePostList, chatRoleAccess] = await Promise.all([
    db.select().from(products),
    db.select().from(productVariants),
    db.select().from(productColors),
    db.select().from(users),
    getSetting(COUNTDOWN_KEY, COUNTDOWN_DEFAULT),
    getSetting(EXCLUSIVE_CODE_KEY, EXCLUSIVE_CODE_DEFAULT),
    db.select().from(newsPosts).orderBy(desc(newsPosts.createdAt)).limit(5),
    db.select().from(preReleaseCodes),
    db.select().from(preReleaseRedemptions),
    db.select().from(pageViews),
    db.select({ id: emailLog.id, to: emailLog.to, subject: emailLog.subject, source: emailLog.source, sentAt: emailLog.sentAt })
      .from(emailLog).orderBy(desc(emailLog.sentAt)).limit(200),
    db.select().from(homePosts).orderBy(desc(homePosts.createdAt)),
    getSetting(CHAT_ROLE_ACCESS_KEY, CHAT_ROLE_ACCESS_DEFAULT),
  ]);

  const userCount = userCountResult.length;
  const viewCount = viewCountResult.length;
  const preReleaseCodesWithCounts = allPreReleaseCodes.map((c) => ({
    ...c,
    redemptionCount: allPreReleaseRedemptions.filter((r) => r.codeId === c.id).length,
  }));

  const groups: AdminFunctionGroup[] = [
    {
      title: "Inhalte",
      items: [
        {
          id: "home-posts",
          title: "Startseiten-Posts",
          description: "Artikel, Videos, Leaks und Making-Ofs für die Startseite",
          keywords: ["startseite", "blog", "post", "artikel", "video", "leak", "makingof"],
          content: <HomePostManager posts={homePostList} canEdit={user.isAdmin || (roleConfig?.canEditPosts ?? false)} />,
          defaultOpen: true,
        },
        {
          id: "news-channel",
          title: "News-Channel",
          description: "Post veröffentlichen — geht an Push + Newsletter raus",
          keywords: ["news", "push", "newsletter", "mail", "ankündigung", "post"],
          content: <NewsChannel recentPosts={recentPosts} />,
        },
      ],
    },
    {
      title: "Produkte",
      items: [
        {
          id: "new-product",
          title: "Neues Produkt anlegen",
          description: "Name, Preis, Rabatt, Größen, Farben, Drop-Limit",
          keywords: ["produkt", "anlegen", "neu", "rabatt", "bild", "upload", "drop"],
          content: <NewProductForm />,
        },
        {
          id: "blob-status",
          title: "Bilder-Upload testen",
          description: "Prüft die Verbindung zu Vercel Blob",
          keywords: ["bild", "upload", "blob", "fehler", "vercel", "foto"],
          content: <BlobStatus />,
        },
        {
          id: "existing-products",
          title: "Bestehende Produkte verwalten",
          description: `${allProducts.length} Produkt${allProducts.length === 1 ? "" : "e"}`,
          keywords: ["produkt", "bearbeiten", "löschen", "variante", "lager"],
          content: (
            <div className="space-y-4">
              {allProducts.length === 0 && (
                <p className="text-xs text-zinc-600 uppercase tracking-widest border border-zinc-800 p-4">Noch keine Produkte.</p>
              )}
              {allProducts.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  variants={allVariants.filter((v) => v.productId === p.id)}
                  colors={allColors.filter((c) => c.productId === p.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))}
                />
              ))}
            </div>
          ),
        },
      ],
    },
    {
      title: "User & Kommunikation",
      items: [
        {
          id: "user-search",
          title: "User-Suche",
          description: "Per Email oder Benutzername (auch alte Namen)",
          keywords: ["user", "suche", "email", "username", "profil"],
          content: <UserSearch />,
        },
        {
          id: "email-log",
          title: "Email-Log",
          description: `${emailEntries.length} versendete Emails — automatische und manuelle`,
          keywords: ["email", "log", "newsletter", "versandt", "mail"],
          content: <EmailLogViewer emails={emailEntries} />,
        },
      ],
    },
    {
      title: "Marketing",
      items: [
        {
          id: "exclusive-codes",
          title: "Erstbesteller-Rabattcodes",
          description: "Code für die ersten N Bestellungen",
          keywords: ["rabatt", "code", "exklusiv", "discount"],
          content: <ExclusiveCodeConfig initial={exclusiveCode} />,
        },
        {
          id: "prerelease-codes",
          title: "Pre-Release-Zugangscodes",
          description: "Schaltet Pre-Release-Produkte vor dem Drop-Datum frei",
          keywords: ["pre-release", "zugang", "code", "vip", "drop"],
          content: <PreReleaseCodeManager codes={preReleaseCodesWithCounts} />,
        },
      ],
    },
    {
      title: "Einstellungen",
      items: [
        {
          id: "countdown",
          title: "Countdown",
          description: "Zieldatum & Label für den Drop-Countdown",
          keywords: ["countdown", "zeit", "drop", "timer"],
          content: <CountdownConfig initial={countdown} />,
        },
      ],
    },
    {
      title: "Team & Rollen",
      items: [
        {
          id: "roles",
          title: "Rollen vergeben",
          description: "Bellator Team-Mitgliedern Admin/Developer/Marketing-Zugriff geben",
          keywords: ["rolle", "team", "berechtigung", "rechte", "marketing", "developer"],
          content: <RoleManager initialRoles={allRoles} />,
        },
        {
          id: "team-chat",
          title: "Team-Chat-Zugriff",
          description: "Wer darf den internen Team-Chat unter /chat nutzen",
          keywords: ["chat", "team-chat", "nachrichten", "zugriff", "berechtigung"],
          content: <TeamChatAccess initialRoleAccess={chatRoleAccess} roles={allRoles} />,
        },
      ],
    },
  ];

  // Nur die Abschnitte zeigen, die die Rolle des eingeloggten Users freigibt.
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((item) => user.isAdmin || (roleConfig?.sections.includes(item.id as AdminSectionId) ?? false)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-mono site-bg">
      <div className="relative z-10 flex flex-col min-h-screen t-invert">
      <GlobalHeader />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-8 space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Admin Panel</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Bellator Streetwear</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest border border-zinc-700 px-3 py-1.5">
              <span className="text-yellow-400 font-bold">{userCount}</span> User
            </span>
            <span className="text-[10px] uppercase tracking-widest border border-zinc-700 px-3 py-1.5">
              <span className="text-blue-400 font-bold">{viewCount}</span> Aufrufe
            </span>
            <Link href="/shop"
              className="text-xs font-bold uppercase tracking-widest text-white bg-black/70 border border-zinc-500 px-3 py-1.5 hover:bg-white hover:text-black transition-all">
              ← Zurück zum Shop
            </Link>
          </div>
        </div>
        <AdminDashboard groups={visibleGroups} />
      </main>
      <GlobalFooter />
      </div>
    </div>
  );
}
