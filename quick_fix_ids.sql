-- Solution rapide: ajouter les IDs manquants que l'interface attend
-- subjectId=9, levelId=11

-- Ajouter la matière avec l'ID attendu (9)
INSERT INTO subjects (id, name, code, description) VALUES 
(9, 'Mathématiques', 'MATH_ADMIN', 'Mathématiques pour admin interface')
ON CONFLICT (id) DO NOTHING;

-- Ajouter le niveau avec l'ID attendu (11)
INSERT INTO levels (id, name, code, category) VALUES 
(11, 'Test Level', 'TEST_LVL', 'lycée')
ON CONFLICT (id) DO NOTHING;

-- Mettre à jour les séquences
SELECT setval('subjects_id_seq', GREATEST((SELECT MAX(id) FROM subjects), 10));
SELECT setval('levels_id_seq', GREATEST((SELECT MAX(id) FROM levels), 12));

-- Vérification
SELECT 'Vérification - matière ID 9:' as info;
SELECT id, code, name FROM subjects WHERE id = 9;

SELECT 'Vérification - niveau ID 11:' as info;
SELECT id, code, name FROM levels WHERE id = 11;