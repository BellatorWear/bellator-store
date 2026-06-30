-- ===================================================================
-- v10: Farben (mit Bildern) + das "Basic Bellator Shirt" wird ein
-- echtes, im Admin-Panel verwaltbares Produkt statt teilweise
-- hardcodiert im Code zu leben.
-- ===================================================================

CREATE TABLE IF NOT EXISTS product_colors (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  hex_color TEXT NOT NULL,
  front_image TEXT NOT NULL,
  back_image TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- --- Das hardgecodete "Basic Bellator Shirt" als echtes Produkt -------
-- Vorher lebte dieses Produkt halb im Code (app/shop/product/basic-
-- bellator-001), halb in der DB (StaticProductCard ging fest von id=1
-- aus). Wird hier per SLUG (nicht per erzwungener id) angelegt - falls
-- über das Admin-Panel schon irgendwelche Test-Produkte erstellt wurden,
-- könnte deren erste id bereits 1 sein; eine erzwungene id=1 hier wäre
-- dann ein Kollisions-/Verwechslungsrisiko. Der App-Code (Shop-Seite,
-- alte Redirect-URL) verlässt sich daher NICHT auf eine feste id, sondern
-- ausschließlich auf den eindeutigen Slug 'basic-bellator-shirt'.
INSERT INTO products (slug, name, description, price_cents, drop_label, drop_limit, sold_count, active)
SELECT 'basic-bellator-shirt', 'Basic Bellator Shirt',
       'Designed for those who never quit. Bellators First Drop.',
       3500, 'Drop #1', NULL, 0, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'basic-bellator-shirt');

-- Farben nur ergänzen, wenn dieses Produkt noch GAR KEINE Farben hat
-- (damit bei mehrfachem Ausführen der Migration nichts doppelt angelegt wird).
INSERT INTO product_colors (product_id, name, hex_color, front_image, back_image, sort_order)
SELECT p.id, 'Schwarz', '#0a0a0a', '/black-front.webp', '/black-back.webp', 0
FROM products p
WHERE p.slug = 'basic-bellator-shirt'
  AND NOT EXISTS (SELECT 1 FROM product_colors WHERE product_id = p.id)
UNION ALL
SELECT p.id, 'Dunkelgrau', '#3f3f3f', '/grey-front.webp', '/grey-back.webp', 1
FROM products p
WHERE p.slug = 'basic-bellator-shirt'
  AND NOT EXISTS (SELECT 1 FROM product_colors WHERE product_id = p.id);
