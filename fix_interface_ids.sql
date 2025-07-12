-- Corriger les IDs pour correspondre à votre base locale
-- Vos IDs actuels: subjects (1,2), levels (1-8, 29-30)
-- L'interface envoie: subjectId: 9, levelId: 11

-- Nettoyer les doublons de classes d'abord
DELETE FROM classes WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY name, level_id ORDER BY id) as rn
        FROM classes
    ) t WHERE rn > 1
);

-- Vérifier les IDs actuels
SELECT 'IDs actuels des matières:' as info;
SELECT id, code, name FROM subjects ORDER BY id;

SELECT 'IDs actuels des niveaux:' as info;
SELECT id, code, name FROM levels ORDER BY id;

-- Le problème: l'interface envoie subjectId=9 et levelId=11
-- Solution: créer des alias ou corriger l'interface

-- Créer les matières avec les IDs attendus par l'interface
INSERT INTO subjects (id, name, code, description) VALUES 
(9, 'Mathématiques (Interface)', 'MATH_INT', 'Mathématiques pour interface admin'),
(10, 'Physique-Chimie (Interface)', 'PC_INT', 'Physique-Chimie pour interface admin')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    description = EXCLUDED.description;

-- Créer les niveaux avec les IDs attendus par l'interface
INSERT INTO levels (id, name, code, category) VALUES 
(11, 'BAC1 (Interface)', 'BAC1_INT', 'lycée'),
(12, 'BAC2 (Interface)', 'BAC2_INT', 'lycée')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    category = EXCLUDED.category;

-- Mettre à jour les séquences
SELECT setval('subjects_id_seq', (SELECT MAX(id) FROM subjects));
SELECT setval('levels_id_seq', (SELECT MAX(id) FROM levels));

-- Vérification finale
SELECT 'Matières après correction:' as info;
SELECT id, code, name FROM subjects WHERE id IN (1, 2, 9, 10) ORDER BY id;

SELECT 'Niveaux après correction:' as info;
SELECT id, code, name FROM levels WHERE id IN (1, 2, 3, 4, 11, 12, 29, 30) ORDER BY id;