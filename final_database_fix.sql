-- Script final pour corriger la suppression des niveaux
-- Exécuter avec: psql -U yassine -d edutrack -f final_database_fix.sql

-- 1. Supprimer tous les éléments qui dépendent des niveaux (pour permettre la suppression)
DELETE FROM lessons WHERE id IN (
    SELECT l.id FROM lessons l
    JOIN chapters c ON l.chapter_id = c.id
    WHERE c.level_id IS NOT NULL
);

DELETE FROM chapters WHERE level_id IS NOT NULL;

-- 2. Supprimer les progressions de leçons associées
DELETE FROM lesson_progressions WHERE lesson_id NOT IN (SELECT id FROM lessons);

-- 3. Supprimer les assignations de professeurs liées aux niveaux
DELETE FROM teacher_assignments WHERE class_id IN (
    SELECT id FROM classes WHERE level_id IS NOT NULL
);

-- 4. Supprimer les classes associées aux niveaux
DELETE FROM classes WHERE level_id IS NOT NULL;

-- 5. Maintenant les niveaux peuvent être supprimés librement
-- (Garder quelques niveaux de base pour les tests)
DELETE FROM levels WHERE id NOT IN (8, 9, 10, 11, 12, 13);

-- 6. Remettre les niveaux de base propres
UPDATE levels SET
    name = '1ère Année Collège',
    code = '1AC',
    category = 'college'
WHERE id = 8;

UPDATE levels SET
    name = '2ème Année Collège', 
    code = '2AC',
    category = 'college'
WHERE id = 9;

UPDATE levels SET
    name = '3ème Année Collège',
    code = '3AC', 
    category = 'college'
WHERE id = 10;

UPDATE levels SET
    name = 'Tronc Commun',
    code = 'TC',
    category = 'lycee'
WHERE id = 11;

UPDATE levels SET
    name = '1ère Année Baccalauréat',
    code = '1BAC',
    category = 'lycee'
WHERE id = 12;

UPDATE levels SET
    name = '2ème Année Baccalauréat',
    code = '2BAC',
    category = 'lycee'
WHERE id = 13;

-- 7. Créer quelques niveaux de test pour vérifier la suppression
INSERT INTO levels (name, code, category, "createdAt", "updatedAt") VALUES
('Niveau Test 1', 'TEST1', 'college', NOW(), NOW()),
('Niveau Test 2', 'TEST2', 'lycee', NOW(), NOW()),
('Niveau Test 3', 'TEST3', 'college', NOW(), NOW());

-- 8. Vérifier les résultats
SELECT 'Niveaux après nettoyage:' AS info;
SELECT id, name, code, category FROM levels ORDER BY id;

SELECT 'Nombre de chapitres restants:' AS info;
SELECT COUNT(*) FROM chapters;

SELECT 'Nombre de classes restantes:' AS info;  
SELECT COUNT(*) FROM classes;

SELECT 'Nombre de leçons restantes:' AS info;
SELECT COUNT(*) FROM lessons;

SELECT 'Configuration terminée!' AS info;
SELECT 'Vous pouvez maintenant tester la suppression des niveaux TEST1, TEST2, TEST3' AS info;
SELECT 'Les niveaux de base (1AC, 2AC, 3AC, TC, 1BAC, 2BAC) sont préservés' AS info;