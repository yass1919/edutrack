-- Script pour actualiser les niveaux en local
-- Exécuter avec: psql -U yassine -d edutrack -f actualiser_niveaux_local.sql

-- 1. Nettoyer les niveaux existants (optionnel)
-- DELETE FROM levels WHERE id > 0;

-- 2. Insérer/Mettre à jour les niveaux selon votre structure actuelle
INSERT INTO levels (name, code, category, "createdAt", "updatedAt")
VALUES 
  -- Niveaux Collège
  ('1ère Année Collège', '1AC', 'college', NOW(), NOW()),
  ('2ème Année Collège', '2AC', 'college', NOW(), NOW()),
  ('3ème Année Collège', '3AC', 'college', NOW(), NOW()),
  ('6ème (CE6)', 'CE6', 'college', NOW(), NOW()),
  
  -- Niveaux Lycée
  ('Tronc Commun', 'TC', 'lycee', NOW(), NOW()),
  ('1ère Année Baccalauréat', 'BAC1', 'lycee', NOW(), NOW()),
  ('2ème Année Baccalauréat', 'BAC2', 'lycee', NOW(), NOW()),
  ('1ère Bac Sciences Mathématiques', 'BAC1_SM', 'lycee', NOW(), NOW()),
  ('1ère Bac Sciences Physiques', 'BAC1_SP', 'lycee', NOW(), NOW()),
  ('2ème Bac Sciences Mathématiques', 'BAC2_SM', 'lycee', NOW(), NOW()),
  ('2ème Bac Sciences Physiques', 'BAC2_SP', 'lycee', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  "updatedAt" = NOW();

-- 3. Créer un compte admin si inexistant
INSERT INTO users (username, password, role, "firstName", "lastName", email, "createdAt", "updatedAt")
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQnHO8tOe.VyAoHYNJ7F4tJYCYqrCY5D1YkP.0o6G', 'admin', 'Admin', 'System', 'admin@edutrack.com', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- 4. Ajouter quelques matières si nécessaire
INSERT INTO subjects (name, code, description, "createdAt", "updatedAt")
VALUES 
  ('Mathématiques', 'MATH', 'Mathématiques pour collège et lycée', NOW(), NOW()),
  ('Physique-Chimie', 'PC', 'Physique-Chimie pour collège et lycée', NOW(), NOW()),
  ('Français', 'FR', 'Français', NOW(), NOW()),
  ('Arabe', 'AR', 'Arabe', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = NOW();

-- 5. Vérifier les résultats
SELECT 'Niveaux créés/mis à jour:' AS info;
SELECT id, name, code, category FROM levels ORDER BY category, name;

SELECT 'Matières créées/mises à jour:' AS info;
SELECT id, name, code, description FROM subjects ORDER BY name;

SELECT 'Utilisateurs admin:' AS info;
SELECT id, username, role, "firstName", "lastName" FROM users WHERE role = 'admin';

SELECT 'Configuration terminée!' AS info;
SELECT 'Connectez-vous avec admin / 123456' AS info;
SELECT 'Allez dans Dashboard Admin > Onglet Niveaux (3ème onglet avec icône diplôme)' AS info;