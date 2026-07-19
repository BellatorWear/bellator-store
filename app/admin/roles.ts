import { db } from "@/db";
import { customRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AdminSectionId } from "./permissions";

export type RoleConfig = {
  name: string;
  label: string;
  color: string;
  sections: AdminSectionId[];
  canEditPosts: boolean;
};

function toRoleConfig(row: typeof customRoles.$inferSelect): RoleConfig {
  return {
    name: row.name,
    label: row.label,
    color: row.color,
    sections: Array.isArray(row.sections) ? (row.sections as AdminSectionId[]) : [],
    canEditPosts: row.canEditPosts,
  };
}

// Alle im Adminpanel erstellten Rollen (inkl. der 3 Start-Rollen aus der
// Migration) - für die Rollen-Zuteilung und die Rollen-Verwaltungsseite.
export async function getAllRoles(): Promise<RoleConfig[]> {
  const rows = await db.select().from(customRoles).orderBy(customRoles.id);
  return rows.map(toRoleConfig);
}

export async function getRoleConfig(name: string | null): Promise<RoleConfig | null> {
  if (!name) return null;
  const rows = await db.select().from(customRoles).where(eq(customRoles.name, name));
  return rows[0] ? toRoleConfig(rows[0]) : null;
}

export async function hasSectionAsync(
  roleName: string | null,
  isAdmin: boolean,
  section: AdminSectionId,
): Promise<boolean> {
  if (isAdmin) return true; // volle Admins immer, unabhängig von der Rollen-Konfiguration
  const config = await getRoleConfig(roleName);
  return config?.sections.includes(section) ?? false;
}

export async function canEditPostsAsync(roleName: string | null, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true;
  const config = await getRoleConfig(roleName);
  return config?.canEditPosts ?? false;
}
