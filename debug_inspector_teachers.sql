-- ============================================================================
-- DIAGNOSTIC : PROBLÈME PROFESSEURS ASSIGNÉS DANS L'INTERFACE INSPECTEUR
-- ============================================================================

-- 1. Vérifier les assignations d'inspecteur
SELECT 'Assignations inspecteur actuelles:' as info;
SELECT 
    ia.id,
    ia.inspector_id,
    u.username as inspecteur_nom,
    ia.subject_id,
    s.name as matiere,
    ia.academic_year
FROM inspector_assignments ia
JOIN users u ON ia.inspector_id = u.id
JOIN subjects s ON ia.subject_id = s.id
ORDER BY ia.inspector_id;

-- 2. Vérifier les assignations des professeurs pour la matière de l'inspecteur
SELECT 'Professeurs assignés à la matière Mathématiques:' as info;
SELECT 
    ta.id,
    ta.teacher_id,
    u.username as prof_username,
    u."firstName" as prenom,
    u."lastName" as nom,
    ta.class_id,
    c.name as classe,
    ta.subject_id,
    s.name as matiere,
    ta.academic_year
FROM teacher_assignments ta
JOIN users u ON ta.teacher_id = u.id
JOIN classes c ON ta.class_id = c.id
JOIN subjects s ON ta.subject_id = s.id
WHERE ta.subject_id = 9  -- Mathématiques
ORDER BY u."firstName", c.name;

-- 3. Simuler la requête API getTeachersByInspectorSubject
SELECT 'Simulation de la requête API - Données brutes:' as info;
SELECT 
    ta.id as assignment_id,
    ta.teacher_id,
    ta.class_id,
    ta.subject_id,
    u.id as user_id,
    u.username,
    u."firstName",
    u."lastName",
    u.role,
    c.id as class_id,
    c.name as class_name,
    l.id as level_id,
    l.name as level_name,
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code
FROM teacher_assignments ta
JOIN users u ON ta.teacher_id = u.id
JOIN classes c ON ta.class_id = c.id
JOIN levels l ON c.level_id = l.id
JOIN subjects s ON ta.subject_id = s.id
WHERE ta.subject_id IN (
    SELECT subject_id 
    FROM inspector_assignments 
    WHERE inspector_id = 2
)
ORDER BY u."firstName", c.name;

-- 4. Vérifier s'il y a des problèmes dans la structure des données
SELECT 'Vérification des champs firstName et lastName:' as info;
SELECT 
    id,
    username,
    role,
    COALESCE("firstName", 'MANQUANT') as firstName,
    COALESCE("lastName", 'MANQUANT') as lastName,
    CASE 
        WHEN "firstName" IS NULL OR "lastName" IS NULL THEN 'PROBLÈME'
        ELSE 'OK'
    END as statut
FROM users 
WHERE role = 'teacher'
ORDER BY id;

-- 5. Compter les professeurs par matière
SELECT 'Nombre de professeurs par matière:' as info;
SELECT 
    s.name as matiere,
    COUNT(DISTINCT ta.teacher_id) as nb_professeurs,
    COUNT(ta.id) as nb_assignations
FROM subjects s
LEFT JOIN teacher_assignments ta ON s.id = ta.subject_id
GROUP BY s.id, s.name
ORDER BY s.name;

-- 6. Vérifier si les professeurs ont des noms complets
SELECT 'Professeurs avec noms complets:' as info;
SELECT 
    u.id,
    u.username,
    u."firstName",
    u."lastName",
    u."firstName" || ' ' || u."lastName" as nom_complet,
    COUNT(ta.id) as nb_classes_assignees
FROM users u
LEFT JOIN teacher_assignments ta ON u.id = ta.teacher_id
WHERE u.role = 'teacher'
GROUP BY u.id, u.username, u."firstName", u."lastName"
ORDER BY u."firstName";

-- 7. Diagnostic final
SELECT 'DIAGNOSTIC:' as info;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM inspector_assignments WHERE inspector_id = 2) = 0 
        THEN 'PROBLÈME: Aucune assignation inspecteur'
        WHEN (SELECT COUNT(*) FROM teacher_assignments ta 
              JOIN inspector_assignments ia ON ta.subject_id = ia.subject_id 
              WHERE ia.inspector_id = 2) = 0 
        THEN 'PROBLÈME: Aucun professeur pour la matière assignée'
        WHEN (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND ("firstName" IS NULL OR "lastName" IS NULL)) > 0
        THEN 'PROBLÈME: Professeurs sans nom complet'
        ELSE 'DONNÉES CORRECTES'
    END as diagnostic;