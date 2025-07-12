-- Script pour corriger les IDs et synchroniser avec Replit
-- Exécuter avec: psql -U yassine -d edutrack -f fix_local_ids.sql

-- 1. Supprimer tous les niveaux existants pour repartir à zéro
DELETE FROM levels;

-- 2. Réinitialiser la séquence des IDs
SELECT setval('levels_id_seq', 1, false);

-- 3. Insérer les niveaux avec les mêmes IDs qu'sur Replit
INSERT INTO levels (id, name, code, category, "createdAt", "updatedAt") VALUES
(8, '1AC', '1AC', 'college', NOW(), NOW()),
(9, '2AC', '2AC', 'college', NOW(), NOW()),
(10, '3AC', '3AC', 'college', NOW(), NOW()),
(11, 'TC', 'TC', 'lycee', NOW(), NOW()),
(12, 'BAC1', 'BAC1', 'lycee', NOW(), NOW()),
(13, 'BAC2', 'BAC2', 'lycee', NOW(), NOW()),
(18, '1ère Bac Sciences Physiques', 'BAC1_SP', 'lycee', NOW(), NOW()),
(19, '1ère Bac Sciences Mathématiques', 'BAC1_SM', 'lycee', NOW(), NOW()),
(20, '2ème Bac Sciences Physiques', 'BAC2_SP', 'lycee', NOW(), NOW()),
(21, '2ème Bac Sciences Mathématiques', 'BAC2_SM', 'lycee', NOW(), NOW()),
(28, 'CE6', 'CE6', 'college', NOW(), NOW());

-- 4. Ajuster la séquence pour les prochains IDs
SELECT setval('levels_id_seq', 30, true);

-- 5. Vérifier les matières et les synchroniser
DELETE FROM subjects;
SELECT setval('subjects_id_seq', 1, false);

INSERT INTO subjects (id, name, code, description, "createdAt", "updatedAt") VALUES
(9, 'Mathématiques', 'MATH', 'Mathématiques pour collège et lycée', NOW(), NOW()),
(10, 'Physique-Chimie', 'PC', 'Physique-Chimie pour collège et lycée', NOW(), NOW()),
(15, 'Français', '003', '', NOW(), NOW()),
(16, 'Arabe', '004', 'Arabe', NOW(), NOW());

SELECT setval('subjects_id_seq', 17, true);

-- 6. Vérifier/créer le compte admin avec le bon ID
INSERT INTO users (id, username, password, role, "firstName", "lastName", email, "createdAt", "updatedAt")
VALUES (4, 'admin', '$2b$10$92IXUNpkjO0rOQnHO8tOe.VyAoHYNJ7F4tJYCYqrCY5D1YkP.0o6G', 'admin', 'Admin', 'System', 'admin@edutrack.com', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET
  id = EXCLUDED.id,
  role = EXCLUDED.role,
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  email = EXCLUDED.email,
  "updatedAt" = NOW();

-- 7. Vérifier les résultats
SELECT 'Niveaux synchronisés:' AS info;
SELECT id, name, code, category FROM levels ORDER BY id;

SELECT 'Matières synchronisées:' AS info;
SELECT id, name, code, description FROM subjects ORDER BY id;

SELECT 'Utilisateur admin:' AS info;
SELECT id, username, role, "firstName", "lastName" FROM users WHERE username = 'admin';

SELECT 'Synchronisation terminée!' AS info;
SELECT 'Redémarrez votre serveur local: npm run dev' AS info;
SELECT 'Connectez-vous avec admin / 123456' AS info;