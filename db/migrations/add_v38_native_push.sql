-- ===================================================================
-- v38: Native Push-Notification-Tokens (Capacitor iOS/Android App)
-- ===================================================================
-- Ergänzt die bestehende Web-Push-Subscription (push_subscription/
-- push_enabled) um einen zweiten, parallelen Kanal für die native App
-- (siehe capacitor.config.ts) - Web Push und native Push (FCM/APNs)
-- sind technisch komplett unterschiedliche Systeme, ein User kann
-- potenziell beides gleichzeitig haben (Browser UND App installiert).

ALTER TABLE users ADD COLUMN IF NOT EXISTS native_push_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS native_push_platform TEXT; -- 'ios' | 'android'
