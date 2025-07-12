-- Script pour configurer l'onglet Niveaux en local
-- Exécuter avec: psql -U yassine -d edutrack -f setup_local_levels_tab.sql

-- 1. Créer un utilisateur admin si inexistant
INSERT INTO users (username, password, role, "firstName", "lastName", email, "createdAt", "updatedAt")
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQnHO8tOe.VyAoHYNJ7F4tJYCYqrCY5D1YkP.0o6G', 'admin', 'Admin', 'System', 'admin@edutrack.com', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- 2. Vérifier les niveaux existants
SELECT 'Niveaux existants:' AS info;
SELECT id, name, code, category FROM levels ORDER BY category, name;

-- 3. Ajouter quelques niveaux de test si la table est vide
INSERT INTO levels (name, code, category, "createdAt", "updatedAt")
VALUES 
  ('1ère Année Collège', '1AC', 'college', NOW(), NOW()),
  ('2ème Année Collège', '2AC', 'college', NOW(), NOW()),
  ('3ème Année Collège', '3AC', 'college', NOW(), NOW()),
  ('Tronc Commun', 'TC', 'lycee', NOW(), NOW()),
  ('1ère Année Baccalauréat', '1BAC', 'lycee', NOW(), NOW()),
  ('2ème Année Baccalauréat', '2BAC', 'lycee', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 4. Vérifier les matières existantes
SELECT 'Matières existantes:' AS info;
SELECT id, name, code FROM subjects ORDER BY name;

-- 5. Ajouter quelques matières de test si nécessaire
INSERT INTO subjects (name, code, description, "createdAt", "updatedAt")
VALUES 
  ('Mathématiques', 'MATH', 'Matière de mathématiques', NOW(), NOW()),
  ('Physique-Chimie', 'PC', 'Matière de physique et chimie', NOW(), NOW()),
  ('Français', 'FR', 'Matière de français', NOW(), NOW()),
  ('Arabe', 'AR', 'Matière d\'arabe', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- 6. Afficher le résultat final
SELECT 'Configuration terminée!' AS info;
SELECT 'Connectez-vous avec:' AS info;
SELECT 'Username: admin' AS info;
SELECT 'Password: 123456' AS info;
SELECT 'Puis allez dans Dashboard Admin > Onglet Niveaux' AS info;

-- 7. Afficher les niveaux créés
SELECT 'Niveaux disponibles:' AS info;
SELECT id, name, code, category FROM levels ORDER BY category, name;