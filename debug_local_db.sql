-- Script de debug pour diagnostiquer la base locale
-- Exécuter avec: psql -U yassine -d edutrack -f debug_local_db.sql

-- 1. Vérifier la structure de la table levels
\d levels

-- 2. Vérifier les données existantes
SELECT 'Niveaux actuels dans la base:' AS info;
SELECT id, name, code, category, "createdAt", "updatedAt" FROM levels ORDER BY id;

-- 3. Vérifier la table users
SELECT 'Utilisateurs existants:' AS info;
SELECT id, username, role, "firstName", "lastName" FROM users ORDER BY id;

-- 4. Vérifier la table subjects
SELECT 'Matières existantes:' AS info;
SELECT id, name, code, description FROM subjects ORDER BY id;

-- 5. Vérifier s'il y a des contraintes qui pourraient bloquer
SELECT 'Contraintes sur la table levels:' AS info;
SELECT conname, contype, confrelid::regclass, conkey, confkey
FROM pg_constraint
WHERE conrelid = 'levels'::regclass;

-- 6. Essayer de créer un niveau de test
INSERT INTO levels (name, code, category, "createdAt", "updatedAt")
VALUES ('Test Niveau', 'TEST', 'college', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  "updatedAt" = NOW();

-- 7. Vérifier si le niveau de test a été créé
SELECT 'Après insertion de test:' AS info;
SELECT id, name, code, category FROM levels WHERE code = 'TEST';

-- 8. Nettoyer le niveau de test
DELETE FROM levels WHERE code = 'TEST';

-- 9. Compter les enregistrements
SELECT 'Nombre de niveaux:' AS info, COUNT(*) as count FROM levels;
SELECT 'Nombre d\'utilisateurs:' AS info, COUNT(*) as count FROM users;
SELECT 'Nombre de matières:' AS info, COUNT(*) as count FROM subjects;