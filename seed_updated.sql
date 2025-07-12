-- Script pour initialiser la base de données avec les données de test
-- Mis à jour avec les IDs corrects

-- Insérer les matières
INSERT INTO subjects (name, code, description) VALUES 
('Mathématiques', 'MATH', 'Enseignement des mathématiques'),
('Physique-Chimie', 'PC', 'Enseignement de la physique et chimie')
ON CONFLICT (code) DO NOTHING;

-- Insérer les niveaux
INSERT INTO levels (name, code, category) VALUES 
('1AC', '1AC', 'collège'),
('2AC', '2AC', 'collège'),
('3AC', '3AC', 'collège'),
('TC', 'TC', 'lycée'),
('BAC1', 'BAC1', 'lycée'),
('BAC2', 'BAC2', 'lycée')
ON CONFLICT (code) DO NOTHING;

-- Insérer les utilisateurs (mot de passe: "password" pour tous)
INSERT INTO users (username, password, role, first_name, last_name, email) VALUES 
('admin', '$2b$10$K8gF4z9G2H5J3k6M8n9Q1e0Q1w2E3r4T5y6U7i8O9p0A1s2D3f4G5h', 'admin', 'Admin', 'System', 'admin@edutrack.ma'),
('PL1', '$2b$10$K8gF4z9G2H5J3k6M8n9Q1e0Q1w2E3r4T5y6U7i8O9p0A1s2D3f4G5h', 'teacher', 'Professeur', 'Lycée', 'prof@edutrack.ma'),
('PC1', '$2b$10$K8gF4z9G2H5J3k6M8n9Q1e0Q1w2E3r4T5y6U7i8O9p0A1s2D3f4G5h', 'teacher', 'Professeur', 'Physique', 'pc1@edutrack.ma'),
('IN1', '$2b$10$K8gF4z9G2H5J3k6M8n9Q1e0Q1w2E3r4T5y6U7i8O9p0A1s2D3f4G5h', 'inspector', 'Inspecteur', 'Math', 'inspecteur@edutrack.ma'),
('founder', '$2b$10$K8gF4z9G2H5J3k6M8n9Q1e0Q1w2E3r4T5y6U7i8O9p0A1s2D3f4G5h', 'founder', 'Fondateur', 'École', 'fondateur@edutrack.ma'),
('sg1', '$2b$10$K8gF4z9G2H5J3k6M8n9Q1e0Q1w2E3r4T5y6U7i8O9p0A1s2D3f4G5h', 'sg', 'Surveillant', 'Général', 'sg@edutrack.ma')
ON CONFLICT (username) DO NOTHING;

-- Récupérer les IDs des niveaux pour les classes
-- Classes avec les IDs corrects des niveaux
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
ON CONFLICT DO NOTHING;

-- Insérer quelques assignations de test
-- Assignations professeurs (PC1 = Physique-Chimie, PL1 = Mathématiques)
INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, academic_year) 
SELECT u.id, c.id, s.id, '2024-2025'
FROM users u, classes c, subjects s
WHERE (u.username = 'PC1' AND c.name = '1AC A' AND s.code = 'PC')
   OR (u.username = 'PC1' AND c.name = '1AC B' AND s.code = 'PC')
   OR (u.username = 'PL1' AND c.name = '1AC A' AND s.code = 'MATH')
   OR (u.username = 'PL1' AND c.name = '2AC A' AND s.code = 'MATH')
ON CONFLICT DO NOTHING;

-- Assignations inspecteur (IN1 = Mathématiques)
INSERT INTO inspector_assignments (inspector_id, subject_id, academic_year) VALUES 
((SELECT id FROM users WHERE username = 'IN1'), (SELECT id FROM subjects WHERE code = 'MATH'), '2024-2025')
ON CONFLICT DO NOTHING;

-- Assignations SG (sg1 = collège)
INSERT INTO sg_assignments (sg_id, cycle, academic_year) VALUES 
((SELECT id FROM users WHERE username = 'sg1'), 'collège', '2024-2025')
ON CONFLICT DO NOTHING;

-- ===============================
-- CHAPITRES ET LEÇONS
-- ===============================

-- Insérer les chapitres
INSERT INTO chapters (name, subject_id, level_id, order_index, trimester) VALUES 
-- Physique-Chimie 1AC
('Matière et environnement', (SELECT id FROM subjects WHERE code = 'PC'), (SELECT id FROM levels WHERE code = '1AC'), 1, 1),
('Électricité', (SELECT id FROM subjects WHERE code = 'PC'), (SELECT id FROM levels WHERE code = '1AC'), 2, 2),
-- Physique-Chimie 2AC
('L''air et l''environnement', (SELECT id FROM subjects WHERE code = 'PC'), (SELECT id FROM levels WHERE code = '2AC'), 1, 1),
('Réactions chimiques', (SELECT id FROM subjects WHERE code = 'PC'), (SELECT id FROM levels WHERE code = '2AC'), 2, 2),
-- Physique-Chimie 3AC
('Mécanique et forces', (SELECT id FROM subjects WHERE code = 'PC'), (SELECT id FROM levels WHERE code = '3AC'), 1, 1),
('Optique et lumière', (SELECT id FROM subjects WHERE code = 'PC'), (SELECT id FROM levels WHERE code = '3AC'), 2, 2),
-- Mathématiques 1AC
('Nombres et calcul', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = '1AC'), 1, 1),
('Géométrie', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = '1AC'), 2, 2),
-- Mathématiques 2AC
('Algèbre et expressions', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = '2AC'), 1, 1),
('Géométrie et mesures', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = '2AC'), 2, 2),
-- Mathématiques 3AC
('Fonctions et graphiques', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = '3AC'), 1, 1),
('Théorème de Pythagore', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = '3AC'), 2, 2),
-- Mathématiques TC
('Trigonométrie', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = 'TC'), 1, 1),
('Statistiques', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = 'TC'), 2, 2),
-- Mathématiques BAC1
('Dérivation', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = 'BAC1'), 1, 1),
('Intégration', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = 'BAC1'), 2, 2),
-- Mathématiques BAC2
('Probabilités', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = 'BAC2'), 1, 1),
('Géométrie dans l''espace', (SELECT id FROM subjects WHERE code = 'MATH'), (SELECT id FROM levels WHERE code = 'BAC2'), 2, 2)
ON CONFLICT DO NOTHING;

-- Insérer quelques leçons d'exemple
-- Leçons pour le chapitre "Nombres et calcul" (1AC Mathématiques)
INSERT INTO lessons (title, objectives, chapter_id, planned_date, planned_duration_minutes, order_index) VALUES 
('Nombres entiers naturels', 'Lecture, écriture, comparaison des nombres entiers', (SELECT id FROM chapters WHERE name = 'Nombres et calcul' AND subject_id = (SELECT id FROM subjects WHERE code = 'MATH')), '2025-09-02', 90, 1),
('Addition et soustraction', 'Techniques opératoires, propriétés', (SELECT id FROM chapters WHERE name = 'Nombres et calcul' AND subject_id = (SELECT id FROM subjects WHERE code = 'MATH')), '2025-09-09', 90, 2),
('Multiplication', 'Tables de multiplication, techniques de calcul', (SELECT id FROM chapters WHERE name = 'Nombres et calcul' AND subject_id = (SELECT id FROM subjects WHERE code = 'MATH')), '2025-09-16', 90, 3),
('Division euclidienne', 'Division avec reste, critères de divisibilité', (SELECT id FROM chapters WHERE name = 'Nombres et calcul' AND subject_id = (SELECT id FROM subjects WHERE code = 'MATH')), '2025-09-23', 120, 4),
('Fractions simples', 'Introduction aux fractions, représentation', (SELECT id FROM chapters WHERE name = 'Nombres et calcul' AND subject_id = (SELECT id FROM subjects WHERE code = 'MATH')), '2025-09-30', 120, 5),
('Nombres décimaux', 'Lecture, écriture, comparaison des décimaux', (SELECT id FROM chapters WHERE name = 'Nombres et calcul' AND subject_id = (SELECT id FROM subjects WHERE code = 'MATH')), '2025-10-07', 120, 6)
ON CONFLICT DO NOTHING;

-- Leçons pour le chapitre "Matière et environnement" (1AC Physique-Chimie)
INSERT INTO lessons (title, objectives, chapter_id, planned_date, planned_duration_minutes, order_index) VALUES 
('L''eau dans la nature', 'Identifier l''eau dans différents états, cycle de l''eau, usage quotidien', (SELECT id FROM chapters WHERE name = 'Matière et environnement' AND subject_id = (SELECT id FROM subjects WHERE code = 'PC')), '2025-09-02', 120, 1),
('Les trois états physiques', 'Propriétés des états solide, liquide et gazeux', (SELECT id FROM chapters WHERE name = 'Matière et environnement' AND subject_id = (SELECT id FROM subjects WHERE code = 'PC')), '2025-09-09', 90, 2),
('Volume et capacité', 'Notion de volume, mesure avec éprouvette graduée', (SELECT id FROM chapters WHERE name = 'Matière et environnement' AND subject_id = (SELECT id FROM subjects WHERE code = 'PC')), '2025-09-16', 90, 3),
('Masse des corps', 'Notion de masse, utilisation de la balance', (SELECT id FROM chapters WHERE name = 'Matière et environnement' AND subject_id = (SELECT id FROM subjects WHERE code = 'PC')), '2025-09-23', 120, 4),
('Température et chaleur', 'Distinction température/chaleur, thermomètre', (SELECT id FROM chapters WHERE name = 'Matière et environnement' AND subject_id = (SELECT id FROM subjects WHERE code = 'PC')), '2025-09-30', 90, 5)
ON CONFLICT DO NOTHING;