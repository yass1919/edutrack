-- Script pour ajouter l'onglet Niveaux manquant en local
-- À exécuter après avoir mis à jour le fichier admin-dashboard.tsx

-- 1. Créer le compte admin avec les bonnes données
INSERT INTO users (username, password, role, "firstName", "lastName", email, "createdAt", "updatedAt")
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQnHO8tOe.VyAoHYNJ7F4tJYCYqrCY5D1YkP.0o6G', 'admin', 'Admin', 'System', 'admin@edutrack.com', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  email = EXCLUDED.email,
  "updatedAt" = NOW();

-- 2. Insérer quelques niveaux de test pour vérifier l'onglet
INSERT INTO levels (name, code, category, "createdAt", "updatedAt")
VALUES 
  ('1ère Année Collège', '1AC', 'college', NOW(), NOW()),
  ('2ème Année Collège', '2AC', 'college', NOW(), NOW()),
  ('3ème Année Collège', '3AC', 'college', NOW(), NOW()),
  ('Tronc Commun', 'TC', 'lycee', NOW(), NOW()),
  ('1ère Année Bac', '1BAC', 'lycee', NOW(), NOW()),
  ('2ème Année Bac', '2BAC', 'lycee', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  "updatedAt" = NOW();

-- 3. Insérer des matières de base
INSERT INTO subjects (name, code, description, "createdAt", "updatedAt")
VALUES 
  ('Mathématiques', 'MATH', 'Matière de mathématiques', NOW(), NOW()),
  ('Physique-Chimie', 'PC', 'Matière de physique-chimie', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = NOW();

-- 4. Vérifier les résultats
SELECT 'Configuration terminée pour test de l''onglet Niveaux' AS info;
SELECT 'Niveaux créés:' AS info;
SELECT id, name, code, category FROM levels ORDER BY category, name;
SELECT 'Connectez-vous avec admin/123456 et allez dans Dashboard Admin' AS info;