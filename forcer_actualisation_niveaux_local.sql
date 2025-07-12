-- Script pour forcer l'actualisation de l'interface locale
-- Ce script force la synchronisation entre la base et l'interface
-- Exécuter avec: psql -U yassine -d edutrack -f forcer_actualisation_niveaux_local.sql

-- 1. Vérifier l'état actuel des niveaux
SELECT 'État actuel des niveaux dans la base de données:' AS info;
SELECT id, name, code, category FROM levels ORDER BY id;

-- 2. Supprimer tous les niveaux de test problématiques
DELETE FROM levels WHERE 
    name LIKE '%test%' OR 
    name LIKE '%Test%' OR 
    code LIKE '%TEST%' OR
    code = 'TESTTEST';

-- 3. Nettoyer les dépendances orphelines
DELETE FROM lesson_progressions WHERE lesson_id NOT IN (SELECT id FROM lessons);
DELETE FROM lessons WHERE chapter_id NOT IN (SELECT id FROM chapters);
DELETE FROM chapters WHERE level_id NOT IN (SELECT id FROM levels);
DELETE FROM classes WHERE level_id NOT IN (SELECT id FROM levels);
DELETE FROM teacher_assignments WHERE class_id NOT IN (SELECT id FROM classes);

-- 4. Créer de nouveaux niveaux de test propres
INSERT INTO levels (name, code, category) VALUES
('Niveau Test Alpha', 'TEST_ALPHA', 'college'),
('Niveau Test Beta', 'TEST_BETA', 'lycee'),
('Niveau Test Gamma', 'TEST_GAMMA', 'college')
ON CONFLICT (code) DO NOTHING;

-- 5. Vérifier le résultat final
SELECT 'Niveaux après nettoyage:' AS info;
SELECT id, name, code, category FROM levels ORDER BY id;

SELECT 'Nouveaux niveaux de test créés:' AS info;
SELECT id, name, code, category FROM levels WHERE code LIKE 'TEST_%' ORDER BY id;

-- 6. Statistiques de nettoyage
SELECT 'Statistiques après nettoyage:' AS info;
SELECT 
    (SELECT COUNT(*) FROM levels) as total_levels,
    (SELECT COUNT(*) FROM chapters) as total_chapters,
    (SELECT COUNT(*) FROM classes) as total_classes,
    (SELECT COUNT(*) FROM lessons) as total_lessons,
    (SELECT COUNT(*) FROM teacher_assignments) as total_assignments;

SELECT 'Nettoyage terminé! Redémarrez votre serveur local et actualisez la page.' AS info;