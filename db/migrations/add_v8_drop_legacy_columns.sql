-- Alte, nicht mehr genutzte Spalten aus einer sehr frühen Version der
-- "products"-Tabelle entfernen. Sie wurden nie per Migration angelegt
-- (daher fehlten sie in den bisherigen .sql-Dateien), existieren aber in
-- der echten DB noch - vermutlich von einem frühen "drizzle-kit push".
-- Die NOT-NULL-Regel auf "price" blockiert seitdem jeden neuen Insert,
-- da der aktuelle Code diese Spalte gar nicht mehr kennt/befüllt.
ALTER TABLE products DROP COLUMN IF EXISTS price;
ALTER TABLE products DROP COLUMN IF EXISTS image_url;
ALTER TABLE products DROP COLUMN IF EXISTS stock;
ALTER TABLE products DROP COLUMN IF EXISTS sold_out;
