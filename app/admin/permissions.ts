// Zentrale Adminpanel-Bereichs-Definition. Welche Rollen es gibt und welche
// dieser Bereiche sie freischalten, ist NICHT mehr hier fest einprogrammiert
// - das liegt jetzt in der DB (custom_roles-Tabelle, siehe app/admin/roles.ts),
// damit Admins im Adminpanel eigene Rollen mit frei wählbaren Berechtigungen
// erstellen können statt nur aus 3 festen Presets zu wählen.

export const ADMIN_SECTION_IDS = [
  "home-posts",
  "news-channel",
  "new-product",
  "blob-status",
  "existing-products",
  "user-search",
  "email-log",
  "exclusive-codes",
  "prerelease-codes",
  "countdown",
  "roles",
  "team-chat",
  "tickets",
  "audit-log",
] as const;

export type AdminSectionId = (typeof ADMIN_SECTION_IDS)[number];

// Menschenlesbare Kurz-Labels für die Checkboxen beim Rollen-Erstellen -
// müssen inhaltlich zu den Titeln in admin/page.tsx passen.
export const ADMIN_SECTION_LABELS: Record<AdminSectionId, string> = {
  "home-posts": "Startseiten-Posts",
  "news-channel": "News-Channel",
  "new-product": "Neues Produkt anlegen",
  "blob-status": "Bilder-Upload testen",
  "existing-products": "Bestehende Produkte verwalten",
  "user-search": "User-Suche",
  "email-log": "Email-Log",
  "exclusive-codes": "Erstbesteller-Rabattcodes",
  "prerelease-codes": "Pre-Release-Zugangscodes",
  countdown: "Countdown",
  roles: "Rollen vergeben",
  "team-chat": "Team-Chat-Zugriff",
  tickets: "Support-Tickets",
  "audit-log": "Audit-Log",
};

// ===================================================================
// Team-Chat-Zugriff
// ===================================================================
// Zwei Ebenen, wie angefragt: ein Rollen-Standard (in siteSettings unter
// dem Key CHAT_ROLE_ACCESS_KEY gespeichert, im Adminpanel einstellbar,
// jetzt dynamisch pro erstellter Rolle statt nur 3 fester Keys) und ein
// optionaler Per-User-Override (users.chat_access), der den Standard für
// genau diesen einen Account übersteuert.
export type ChatRoleAccess = Record<string, boolean>;

// Kein Default mehr auf 3 feste Rollennamen - bei einer frisch erstellten
// Rolle ist Chat-Zugriff standardmäßig aus, bis ein Admin ihn in
// TeamChatAccess.tsx explizit einschaltet.
export const CHAT_ROLE_ACCESS_DEFAULT: ChatRoleAccess = {};

type ChatAccessUser = {
  role: string | null;
  isAdmin?: boolean | null;
  chatAccess?: boolean | null;
};

export function hasChatAccess(
  user: ChatAccessUser | null,
  roleDefaults: ChatRoleAccess,
): boolean {
  if (!user) return false;
  // Expliziter Override gewinnt immer - egal ob er Zugriff gibt oder entzieht.
  if (user.chatAccess !== null && user.chatAccess !== undefined)
    return user.chatAccess;
  // Volle Admins haben immer Zugriff, unabhängig vom konfigurierten Standard.
  if (user.isAdmin) return true;
  if (!user.role) return false; // normale Kunden ohne Team-Rolle nie, außer expliziter Override oben
  return roleDefaults[user.role] ?? false;
}
