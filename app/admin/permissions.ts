// Zentrale Rollen-/Rechte-Definition fürs Adminpanel. Ein User hat entweder
// keine Rolle (normaler Kunde), oder eine der folgenden - jede Rolle schaltet
// eine feste Auswahl an Adminpanel-Abschnitten frei (Presets, kein freier
// Rechte-Baukasten, wie angefragt).

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
] as const;

export type AdminSectionId = typeof ADMIN_SECTION_IDS[number];

export type Role = "admin" | "developer" | "marketing";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  developer: "Developer",
  marketing: "Marketing",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Voller Zugriff auf alle Funktionen, inkl. Rollenvergabe.",
  developer: "Produkte, Codes, Countdown, Blob-Status, Startseiten-Artikel & Newsletter - keine Rollenvergabe.",
  marketing: "Kann Artikel & Newsletter-Posts anlegen und veröffentlichen, aber nicht bearbeiten/löschen. Kein Zugriff auf Produkte, Codes oder User-Daten.",
};

// Welche Adminpanel-Abschnitte pro Rolle sichtbar sind.
export const ROLE_SECTIONS: Record<Role, AdminSectionId[]> = {
  admin: [...ADMIN_SECTION_IDS],
  developer: [
    "new-product", "existing-products", "blob-status",
    "exclusive-codes", "prerelease-codes", "countdown",
    "home-posts", "news-channel",
  ],
  marketing: ["home-posts", "news-channel"],
};

// Innerhalb von home-posts/news-channel: dürfen Marketing-User bestehende
// Posts bearbeiten/löschen, oder nur neue anlegen & veröffentlichen?
export function canEditPosts(role: Role | null): boolean {
  return role === "admin" || role === "developer";
}

export function hasSection(role: Role | null, section: AdminSectionId): boolean {
  if (!role) return false;
  return ROLE_SECTIONS[role]?.includes(section) ?? false;
}

export function isValidRole(value: string | null | undefined): value is Role {
  return value === "admin" || value === "developer" || value === "marketing";
}
