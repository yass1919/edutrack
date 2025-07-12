-- Script complet d'export de la base de données EduTrack
-- Généré le 2025-01-07 pour sauvegarde et import local

-- ===============================
-- DONNÉES DE CONFIGURATION
-- ===============================

-- Matières
INSERT INTO subjects (id, name, code, description) VALUES 
(9, 'Mathématiques', 'MATH', 'Mathématiques pour collège et lycée'),
(10, 'Physique-Chimie', 'PC', 'Physique-Chimie pour collège et lycée')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, description = EXCLUDED.description;

-- Niveaux
INSERT INTO levels (id, name, code, category) VALUES 
(8, '1AC', '1AC', 'collège'),
(9, '2AC', '2AC', 'collège'),
(10, '3AC', '3AC', 'collège'),
(11, 'TC', 'TC', 'lycée'),
(12, 'BAC1', 'BAC1', 'lycée'),
(13, 'BAC2', 'BAC2', 'lycée')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, category = EXCLUDED.category;

-- Classes
INSERT INTO classes (id, name, level_id, academic_year) VALUES 
(10, '1AC A', 8, '2024-2025'),
(16, '1AC B', 8, '2024-2025'),
(11, '2AC A', 9, '2024-2025'),
(17, '2AC B', 9, '2024-2025'),
(12, '3AC A', 10, '2024-2025'),
(18, '3AC B', 10, '2024-2025'),
(13, 'TC A', 11, '2024-2025'),
(19, 'TC B', 11, '2024-2025'),
(14, 'BAC1 SP', 12, '2024-2025'),
(20, 'BAC1 SM', 12, '2024-2025'),
(15, 'BAC2 SP', 13, '2024-2025'),
(21, 'BAC2 SM', 13, '2024-2025')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, level_id = EXCLUDED.level_id, academic_year = EXCLUDED.academic_year;

-- ===============================
-- UTILISATEURS DE TEST
-- ===============================

-- Utilisateurs (mot de passe: "password123" pour tous)
INSERT INTO users (id, username, password, role, first_name, last_name, email) VALUES 
(4, 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin', 'System', 'admin@edutrack.ma'),
(1, 'PC1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Professeur', 'Mathématiques', 'PC1@edutrack.ma'),
(6, 'PC3', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Professeur', 'Physique-Chimie', 'PC3@edutrack.ma'),
(2, 'inspecteur', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inspector', 'Inspecteur', 'Mathématiques', 'inspecteur@edutrack.ma'),
(3, 'fondateur', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'founder', 'Fondateur', 'École', 'fondateur@edutrack.ma'),
(5, 'sg1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'sg', 'Surveillant', 'Général', 'sg1@edutrack.ma')
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password, role = EXCLUDED.role, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email;

-- ===============================
-- ASSIGNATIONS
-- ===============================

-- Assignations professeurs
INSERT INTO teacher_assignments (id, teacher_id, class_id, subject_id, academic_year) VALUES 
(1, 1, 10, 9, '2024-2025'),  -- PC1 - Mathématiques - 1AC A
(2, 1, 11, 9, '2024-2025'),  -- PC1 - Mathématiques - 2AC A
(3, 1, 12, 9, '2024-2025'),  -- PC1 - Mathématiques - 3AC A
(4, 6, 16, 10, '2024-2025'), -- PC3 - Physique-Chimie - 1AC B
(5, 6, 18, 10, '2024-2025')  -- PC3 - Physique-Chimie - 3AC B
ON CONFLICT (id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id, class_id = EXCLUDED.class_id, subject_id = EXCLUDED.subject_id, academic_year = EXCLUDED.academic_year;

-- Assignations inspecteur
INSERT INTO inspector_assignments (id, inspector_id, subject_id, academic_year) VALUES 
(1, 2, 9, '2024-2025')  -- inspecteur - Mathématiques
ON CONFLICT (id) DO UPDATE SET inspector_id = EXCLUDED.inspector_id, subject_id = EXCLUDED.subject_id, academic_year = EXCLUDED.academic_year;

-- Assignations SG
INSERT INTO sg_assignments (id, sg_id, cycle, academic_year) VALUES 
(1, 5, 'collège', '2024-2025')  -- sg1 - collège
ON CONFLICT (id) DO UPDATE SET sg_id = EXCLUDED.sg_id, cycle = EXCLUDED.cycle, academic_year = EXCLUDED.academic_year;

-- ===============================
-- PROGRAMME PÉDAGOGIQUE
-- ===============================

-- Chapitres
INSERT INTO chapters (id, name, subject_id, level_id, order_index, trimester) VALUES 
(27, 'Matière et environnement', 10, 8, 1, 1),
(28, 'Électricité', 10, 8, 2, 2),
(29, 'L''air et l''environnement', 10, 9, 1, 1),
(30, 'Réactions chimiques', 10, 9, 2, 2),
(31, 'Mécanique et forces', 10, 10, 1, 1),
(32, 'Optique et lumière', 10, 10, 2, 2),
(33, 'Nombres et calcul', 9, 8, 1, 1),
(34, 'Géométrie', 9, 8, 2, 2),
(35, 'Algèbre et expressions', 9, 9, 1, 1),
(36, 'Géométrie et mesures', 9, 9, 2, 2),
(37, 'Fonctions et graphiques', 9, 10, 1, 1),
(38, 'Théorème de Pythagore', 9, 10, 2, 2),
(39, 'Trigonométrie', 9, 11, 1, 1),
(40, 'Statistiques', 9, 11, 2, 2),
(41, 'Dérivation', 9, 12, 1, 1),
(42, 'Intégration', 9, 12, 2, 2),
(43, 'Probabilités', 9, 13, 1, 1),
(44, 'Géométrie dans l''espace', 9, 13, 2, 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, subject_id = EXCLUDED.subject_id, level_id = EXCLUDED.level_id, order_index = EXCLUDED.order_index, trimester = EXCLUDED.trimester;

-- Mise à jour des séquences
SELECT setval('subjects_id_seq', (SELECT MAX(id) FROM subjects));
SELECT setval('levels_id_seq', (SELECT MAX(id) FROM levels));
SELECT setval('classes_id_seq', (SELECT MAX(id) FROM classes));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('teacher_assignments_id_seq', (SELECT MAX(id) FROM teacher_assignments));
SELECT setval('inspector_assignments_id_seq', (SELECT MAX(id) FROM inspector_assignments));
SELECT setval('sg_assignments_id_seq', (SELECT MAX(id) FROM sg_assignments));
SELECT setval('chapters_id_seq', (SELECT MAX(id) FROM chapters));