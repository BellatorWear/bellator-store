import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string; // letztes Item hat i.d.R. keinen href (aktuelle Seite)
};

/**
 * Zeigt eine Breadcrumb-Navigation UND bettet gleichzeitig das passende
 * BreadcrumbList-JSON-LD ein (schema.org) - Google zeigt das dann als
 * Brotkrümel-Pfad statt der reinen URL in den Suchergebnissen an.
 */
export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-[11px] uppercase tracking-widest text-zinc-500">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-zinc-700">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-white transition">{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-zinc-300">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
