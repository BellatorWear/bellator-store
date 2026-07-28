-- ===================================================================
-- v32: Produkt-Reviews (echte Verifizierung statt Selbstauskunft)
-- ===================================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT product_reviews_rating_range CHECK (rating >= 1 AND rating <= 5)
);

-- Ein Review pro User+Produkt (nicht pro Bestellung) - verhindert, dass
-- jemand für dasselbe Produkt bei jeder Nachbestellung erneut eine
-- Review (und damit erneut die Challenge-Punkte) abgeben kann.
CREATE UNIQUE INDEX IF NOT EXISTS product_reviews_user_product_unique
  ON product_reviews (user_id, product_id);

CREATE INDEX IF NOT EXISTS product_reviews_product_idx ON product_reviews (product_id);

-- Die "review"-Challenge war bewusst deaktiviert, weil sie nur per
-- Selbstauskunft ohne Prüfung ging (siehe add_v9). Jetzt gibt es eine
-- echte, kaufgebundene Review-Funktion (app/shop/reviews.ts) - die
-- Challenge kann also wieder aktiv sein, wird aber ausschließlich
-- serverseitig nach einer erfolgreich eingereichten Review vergeben,
-- nicht mehr per Selbst-Antippen.
UPDATE challenges SET active = true WHERE type = 'review';
