-- Script d'import pour base de données existante
-- S'adapte aux IDs existants dans votre base locale

-- ===============================
-- 1. VÉRIFIER ET COMPLÉTER LES DONNÉES DE BASE
-- ===============================

-- Insérer les matières si elles n'existent pas
INSERT INTO subjects (name, code, description) VALUES 
('Mathématiques', 'MATH', 'Mathématiques pour collège et lycée'),
('Physique-Chimie', 'PC', 'Physique-Chimie pour collège et lycée')
ON CONFLICT (code) DO NOTHING;

-- Insérer les niveaux si ils n'existent pas
INSERT INTO levels (name, code, category) VALUES 
('1AC', '1AC', 'collège'),
('2AC', '2AC', 'collège'),
('3AC', '3AC', 'collège'),
('TC', 'TC', 'lycée'),
('BAC1', 'BAC1', 'lycée'),
('BAC2', 'BAC2', 'lycée')
ON CONFLICT (code) DO NOTHING;

-- Insérer les utilisateurs si ils n'existent pas (mot de passe: password123)
INSERT INTO users (username, password, role, first_name, last_name, email) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin', 'System', 'admin@edutrack.ma'),
('PC1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Professeur', 'Mathématiques', 'PC1@edutrack.ma'),
('PC3', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Professeur', 'Physique-Chimie', 'PC3@edutrack.ma'),
('inspecteur', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inspector', 'Inspecteur', 'Mathématiques', 'inspecteur@edutrack.ma'),
('fondateur', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'founder', 'Fondateur', 'École', 'fondateur@edutrack.ma'),
('sg1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'sg', 'Surveillant', 'Général', 'sg1@edutrack.ma')
ON CONFLICT (username) DO NOTHING;

-- Insérer les classes en utilisant les IDs existants
INSERT INTO classes (name, level_id, academic_year) VALUES 
('1AC A', (SELECT id FROM levels WHERE code = '1AC'), '2024-2025'),
('1AC B', (SELECT id FROM levels WHERE code = '1AC'), '2024-2025'),
('2AC A', (SELECT id FROM levels WHERE code = '2AC'), '2024-2025'),
('2AC B', (SELECT id FROM levels WHERE code = '2AC'), '2024-2025'),
('3AC A', (SELECT id FROM levels WHERE code = '3AC'), '2024-2025'),
('3AC B', (SELECT id FROM levels WHERE code = '3AC'), '2024-2025'),
('TC A', (SELECT id FROM levels WHERE code = 'TC'), '2024-2025'),
('TC B', (SELECT id FROM levels WHERE code = 'TC'), '2024-2025'),
('BAC1 SP', (SELECT id FROM levels WHERE code = 'BAC1'), '2024-2025'),
('BAC1 SM', (SELECT id FROM levels WHERE code = 'BAC1'), '2024-2025'),
('BAC2 SP', (SELECT id FROM levels WHERE code = 'BAC2'), '2024-2025'),
('BAC2 SM', (SELECT id FROM levels WHERE code = 'BAC2'), '2024-2025')
ON CONFLICT (name, level_id, academic_year) DO NOTHING;

-- ===============================
-- 2. ASSIGNATIONS AVEC IDS DYNAMIQUES
-- ===============================

-- Assignations professeurs
INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, academic_year) 
SELECT u.id, c.id, s.id, '2024-2025'
FROM users u, classes c, subjects s
WHERE (u.username = 'PC1' AND c.name = '1AC A' AND s.code = 'MATH')
   OR (u.username = 'PC1' AND c.name = '2AC A' AND s.code = 'MATH')
   OR (u.username = 'PC1' AND c.name = '3AC A' AND s.code = 'MATH')
   OR (u.username = 'PC3' AND c.name = '1AC B' AND s.code = 'PC')
   OR (u.username = 'PC3' AND c.name = '3AC B' AND s.code = 'PC')
ON CONFLICT (teacher_id, class_id, subject_id, academic_year) DO NOTHING;

-- Assignations inspecteur
INSERT INTO inspector_assignments (inspector_id, subject_id, academic_year) 
SELECT u.id, s.id, '2024-2025'
FROM users u, subjects s
WHERE u.username = 'inspecteur' AND s.code = 'MATH'
ON CONFLICT (inspector_id, subject_id, academic_year) DO NOTHING;

-- Assignations SG
INSERT INTO sg_assignments (sg_id, cycle, academic_year) 
SELECT u.id, 'collège', '2024-2025'
FROM users u
WHERE u.username = 'sg1'
ON CONFLICT (sg_id, cycle, academic_year) DO NOTHING;

-- ===============================
-- 3. CHAPITRES AVEC IDS DYNAMIQUES
-- ===============================

-- Supprimer les chapitres existants pour éviter les doublons
DELETE FROM chapters;

-- Insérer les chapitres
INSERT INTO chapters (name, subject_id, level_id, order_index, trimester) 
SELECT ch.name, s.id, l.id, ch.order_index, ch.trimester
FROM (VALUES
    -- Physique-Chimie
    ('Matière et environnement', 'PC', '1AC', 1, 1),
    ('Électricité', 'PC', '1AC', 2, 2),
    ('L''air et l''environnement', 'PC', '2AC', 1, 1),
    ('Réactions chimiques', 'PC', '2AC', 2, 2),
    ('Mécanique et forces', 'PC', '3AC', 1, 1),
    ('Optique et lumière', 'PC', '3AC', 2, 2),
    -- Mathématiques
    ('Nombres et calcul', 'MATH', '1AC', 1, 1),
    ('Géométrie', 'MATH', '1AC', 2, 2),
    ('Algèbre et expressions', 'MATH', '2AC', 1, 1),
    ('Géométrie et mesures', 'MATH', '2AC', 2, 2),
    ('Fonctions et graphiques', 'MATH', '3AC', 1, 1),
    ('Théorème de Pythagore', 'MATH', '3AC', 2, 2),
    ('Trigonométrie', 'MATH', 'TC', 1, 1),
    ('Statistiques', 'MATH', 'TC', 2, 2),
    ('Dérivation', 'MATH', 'BAC1', 1, 1),
    ('Intégration', 'MATH', 'BAC1', 2, 2),
    ('Probabilités', 'MATH', 'BAC2', 1, 1),
    ('Géométrie dans l''espace', 'MATH', 'BAC2', 2, 2)
) AS ch(name, subject_code, level_code, order_index, trimester)
JOIN subjects s ON s.code = ch.subject_code
JOIN levels l ON l.code = ch.level_code;

-- ===============================
-- 4. LEÇONS D'EXEMPLE
-- ===============================

-- Supprimer les leçons existantes
DELETE FROM lessons;

-- Leçons pour "Nombres et calcul" (1AC Mathématiques)
INSERT INTO lessons (title, objectives, chapter_id, planned_date, planned_duration_minutes, order_index)
SELECT l.title, l.objectives, c.id, l.planned_date::date, l.planned_duration_minutes, l.order_index
FROM (VALUES
    ('Nombres entiers naturels', 'Lecture, écriture, comparaison des nombres entiers', '2025-09-02', 90, 1),
    ('Addition et soustraction', 'Techniques opératoires, propriétés', '2025-09-09', 90, 2),
    ('Multiplication', 'Tables de multiplication, techniques de calcul', '2025-09-16', 90, 3),
    ('Division euclidienne', 'Division avec reste, critères de divisibilité', '2025-09-23', 120, 4),
    ('Fractions simples', 'Introduction aux fractions, représentation', '2025-09-30', 120, 5),
    ('Nombres décimaux', 'Lecture, écriture, comparaison des décimaux', '2025-10-07', 120, 6)
) AS l(title, objectives, planned_date, planned_duration_minutes, order_index)
JOIN chapters c ON c.name = 'Nombres et calcul'
JOIN subjects s ON c.subject_id = s.id AND s.code = 'MATH'
JOIN levels lv ON c.level_id = lv.id AND lv.code = '1AC';

-- Leçons pour "Matière et environnement" (1AC Physique-Chimie)
INSERT INTO lessons (title, objectives, chapter_id, planned_date, planned_duration_minutes, order_index)
SELECT l.title, l.objectives, c.id, l.planned_date::date, l.planned_duration_minutes, l.order_index
FROM (VALUES
    ('L''eau dans la nature', 'Identifier l''eau dans différents états, cycle de l''eau', '2025-09-02', 120, 1),
    ('Les trois états physiques', 'Propriétés des états solide, liquide et gazeux', '2025-09-09', 90, 2),
    ('Volume et capacité', 'Notion de volume, mesure avec éprouvette graduée', '2025-09-16', 90, 3),
    ('Masse des corps', 'Notion de masse, utilisation de la balance', '2025-09-23', 120, 4),
    ('Température et chaleur', 'Distinction température/chaleur, thermomètre', '2025-09-30', 90, 5)
) AS l(title, objectives, planned_date, planned_duration_minutes, order_index)
JOIN chapters c ON c.name = 'Matière et environnement'
JOIN subjects s ON c.subject_id = s.id AND s.code = 'PC'
JOIN levels lv ON c.level_id = lv.id AND lv.code = '1AC';

-- Afficher un résumé des données importées
SELECT 'Matières' as table_name, COUNT(*) as count FROM subjects
UNION ALL
SELECT 'Niveaux', COUNT(*) FROM levels
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes
UNION ALL
SELECT 'Utilisateurs', COUNT(*) FROM users
UNION ALL
SELECT 'Chapitres', COUNT(*) FROM chapters
UNION ALL
SELECT 'Leçons', COUNT(*) FROM lessons
UNION ALL
SELECT 'Assignations profs', COUNT(*) FROM teacher_assignments
UNION ALL
SELECT 'Assignations inspecteurs', COUNT(*) FROM inspector_assignments
UNION ALL
SELECT 'Assignations SG', COUNT(*) FROM sg_assignments;