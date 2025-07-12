-- Script pour actualiser la base de données locale et permettre la suppression des niveaux
-- Exécuter avec: psql -U yassine -d edutrack -f actualiser_suppression_niveaux_local.sql

-- 1. Supprimer les progressions de leçons qui bloquent la suppression des niveaux
DELETE FROM lesson_progressions WHERE lesson_id IN (
    SELECT l.id FROM lessons l
    JOIN chapters c ON l.chapter_id = c.id
    WHERE c.level_id IN (11, 29, 33)  -- Niveaux problématiques
);

-- 2. Supprimer les leçons liées aux chapitres des niveaux problématiques
DELETE FROM lessons WHERE chapter_id IN (
    SELECT id FROM chapters WHERE level_id IN (11, 29, 33)
);

-- 3. Supprimer les chapitres des niveaux problématiques
DELETE FROM chapters WHERE level_id IN (11, 29, 33);

-- 4. Supprimer les assignations de professeurs liées aux classes de ces niveaux
DELETE FROM teacher_assignments WHERE class_id IN (
    SELECT id FROM classes WHERE level_id IN (11, 29, 33)
);

-- 5. Supprimer les classes liées aux niveaux problématiques
DELETE FROM classes WHERE level_id IN (11, 29, 33);

-- 6. Maintenant supprimer les niveaux problématiques
DELETE FROM levels WHERE id IN (11, 29, 33);

-- 7. Créer 3 niveaux de test pour tester la suppression
INSERT INTO levels (name, code, category) VALUES
('Niveau Test A', 'TEST_A', 'college'),
('Niveau Test B', 'TEST_B', 'lycee'),
('Niveau Test C', 'TEST_C', 'college')
ON CONFLICT (code) DO NOTHING;

-- 8. Vérifier l'état final
SELECT 'Niveaux disponibles après nettoyage:' AS info;
SELECT id, name, code, category FROM levels ORDER BY id;

SELECT 'Niveaux de test créés (peuvent être supprimés):' AS info;
SELECT id, name, code, category FROM levels WHERE code LIKE 'TEST_%' ORDER BY id;

SELECT 'Chapitres restants:' AS info;
SELECT COUNT(*) as total_chapters FROM chapters;

SELECT 'Classes restantes:' AS info;
SELECT COUNT(*) as total_classes FROM classes;

SELECT 'Leçons restantes:' AS info;
SELECT COUNT(*) as total_lessons FROM lessons;

SELECT 'Configuration terminée! Vous pouvez maintenant tester la suppression des niveaux TEST_A, TEST_B, TEST_C' AS info;