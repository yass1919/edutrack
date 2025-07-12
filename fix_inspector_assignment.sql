-- =====================================================================
-- SCRIPT CORRECTIF : ASSIGNATION INSPECTEUR ET DONNÉES FONCTIONNELLES
-- =====================================================================
-- À exécuter sur votre base de données locale edutrack

-- 1. Vérification de l'état actuel
SELECT 'État actuel des utilisateurs:' as info;
SELECT id, username, role, "firstName", "lastName" FROM users WHERE role IN ('inspector', 'teacher') ORDER BY role, id;

SELECT 'État actuel des assignations inspecteur:' as info;
SELECT * FROM inspector_assignments;

SELECT 'État actuel des assignations professeur:' as info;
SELECT * FROM teacher_assignments;

-- 2. Correction des assignations manquantes
-- Assigner l'inspecteur (id: 2) à la matière Mathématiques (id: 9)
INSERT INTO inspector_assignments (inspector_id, subject_id, academic_year) VALUES 
(2, 9, '2024-2025')
ON CONFLICT (inspector_id, subject_id, academic_year) DO NOTHING;

-- 3. Vérification qu'il existe des professeurs de mathématiques
-- Si nécessaire, créer une assignation de professeur pour test
-- Vérifier d'abord s'il existe un professeur
SELECT 'Professeurs existants:' as info;
SELECT id, username, role, "firstName", "lastName" FROM users WHERE role = 'teacher';

-- Si aucun professeur n'existe, en créer un pour test
INSERT INTO users (username, password, role, "firstName", "lastName", email)
VALUES ('prof_math', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Mohammed', 'Alami', 'prof.math@school.ma')
ON CONFLICT (username) DO NOTHING;

-- Récupérer l'ID du professeur
-- Assigner ce professeur à une classe pour la matière Mathématiques
INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, academic_year)
SELECT 
    u.id as teacher_id,
    c.id as class_id,
    9 as subject_id,  -- Mathématiques
    '2024-2025' as academic_year
FROM users u
CROSS JOIN classes c
WHERE u.role = 'teacher' 
  AND u.username = 'prof_math'
  AND c.name = '1AC-A'  -- Première classe disponible
ON CONFLICT (teacher_id, class_id, subject_id, academic_year) DO NOTHING;

-- 4. Vérification des données après correction
SELECT 'Assignations inspecteur après correction:' as info;
SELECT 
    ia.id,
    u.username as inspecteur,
    s.name as matiere,
    ia.academic_year
FROM inspector_assignments ia
JOIN users u ON ia.inspector_id = u.id
JOIN subjects s ON ia.subject_id = s.id;

SELECT 'Assignations professeur après correction:' as info;
SELECT 
    ta.id,
    u.username as professeur,
    u."firstName" || ' ' || u."lastName" as nom_complet,
    c.name as classe,
    s.name as matiere,
    ta.academic_year
FROM teacher_assignments ta
JOIN users u ON ta.teacher_id = u.id
JOIN classes c ON ta.class_id = c.id
JOIN subjects s ON ta.subject_id = s.id
WHERE s.id = 9  -- Mathématiques
ORDER BY u."firstName";

-- 5. Test de la requête que fait l'API inspecteur
SELECT 'Test de la requête API inspecteur:' as info;
SELECT 
    u.id,
    u.username,
    u."firstName",
    u."lastName",
    ta.class_id,
    c.name as class_name,
    s.name as subject_name
FROM teacher_assignments ta
JOIN users u ON ta.teacher_id = u.id
JOIN classes c ON ta.class_id = c.id
JOIN subjects s ON ta.subject_id = s.id
WHERE s.id IN (
    SELECT subject_id FROM inspector_assignments WHERE inspector_id = 2
);

-- 6. Création de quelques progressions de test (optionnel)
-- Pour avoir des données à valider
INSERT INTO lesson_progressions (lesson_id, class_id, teacher_id, status, actual_date, actual_duration_minutes, notes)
SELECT 
    l.id as lesson_id,
    ta.class_id,
    ta.teacher_id,
    'completed' as status,
    CURRENT_DATE - INTERVAL '2 days' as actual_date,
    50 as actual_duration_minutes,
    'Leçon terminée, en attente de validation' as notes
FROM lessons l
JOIN chapters ch ON l.chapter_id = ch.id
JOIN teacher_assignments ta ON ch.subject_id = ta.subject_id
WHERE ch.subject_id = 9  -- Mathématiques
  AND ta.subject_id = 9  -- Mathématiques
LIMIT 3
ON CONFLICT (lesson_id, class_id, teacher_id) DO NOTHING;

-- 7. Message de confirmation
SELECT 'CORRECTION TERMINÉE' as status, 
       'L inspecteur peut maintenant voir les professeurs de mathématiques' as message;

-- 8. Instructions pour test
SELECT 'INSTRUCTIONS DE TEST:' as info;
SELECT '1. Redémarrez votre serveur Node.js' as step1;
SELECT '2. Connectez-vous avec: username=inspecteur, password=123456' as step2;
SELECT '3. Vous devriez voir les professeurs de mathématiques' as step3;
SELECT '4. Vous pourrez valider les progressions en attente' as step4;