-- ====================================================================
-- SCRIPT DE MISE À JOUR : FONCTIONNALITÉ CRÉATION MATIÈRES ET NIVEAUX
-- ====================================================================
-- À exécuter sur votre base de données locale edutrack
-- Ce script synchronise votre base avec les nouvelles fonctionnalités

-- 1. Vérification de l'état actuel
SELECT 'État actuel des matières:' as info;
SELECT id, name, code, description FROM subjects ORDER BY id;

SELECT 'État actuel des niveaux:' as info;
SELECT id, name, code, category FROM levels ORDER BY id;

-- 2. Ajout des nouvelles matières créées (si pas déjà présentes)
INSERT INTO subjects (id, name, code, description) VALUES 
(15, 'Français', '003', ''),
(16, 'Arabe', '004', 'Arabe')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description;

-- 3. Ajout des nouveaux niveaux créés (si pas déjà présents)
INSERT INTO levels (id, name, code, category) VALUES 
(28, 'CE6', 'CE6', 'collège')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category;

-- 4. Mise à jour des séquences pour éviter les conflits d'IDs
SELECT setval('subjects_id_seq', (SELECT MAX(id) FROM subjects));
SELECT setval('levels_id_seq', (SELECT MAX(id) FROM levels));

-- 5. Vérification après mise à jour
SELECT 'Matières après mise à jour:' as info;
SELECT id, name, code, description FROM subjects ORDER BY name;

SELECT 'Niveaux après mise à jour:' as info;
SELECT id, name, code, category FROM levels ORDER BY category, name;

-- 6. Vérification des logs d'audit pour les nouvelles créations
SELECT 'Logs récents de création:' as info;
SELECT created_at, action, entity_type, details 
FROM audit_logs 
WHERE action IN ('create_subject', 'create_level')
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Message de confirmation
SELECT 'MISE À JOUR TERMINÉE' as status, 
       'Les fonctionnalités de création de matières et niveaux sont maintenant disponibles' as message;