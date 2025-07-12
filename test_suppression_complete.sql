-- Test complet de suppression des niveaux
-- Exécuter avec: psql -U yassine -d edutrack -f test_suppression_complete.sql

-- 1. Créer un niveau de test
INSERT INTO levels (name, code, category) VALUES 
('NIVEAU_TEST_FINAL', 'TEST_FINAL', 'college')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category;

-- 2. Vérifier la création
SELECT 'Niveau créé:' as info;
SELECT id, name, code, category FROM levels WHERE code = 'TEST_FINAL';

-- 3. Attendre puis supprimer le niveau
SELECT 'Suppression du niveau TEST_FINAL...' as info;
DELETE FROM levels WHERE code = 'TEST_FINAL';

-- 4. Vérifier la suppression
SELECT 'Vérification après suppression:' as info;
SELECT id, name, code, category FROM levels WHERE code = 'TEST_FINAL';

-- 5. Afficher tous les niveaux actuels
SELECT 'Tous les niveaux actuels:' as info;
SELECT id, name, code, category FROM levels ORDER BY id;

SELECT 'Test terminé! Vérifiez maintenant l''interface.' as info;