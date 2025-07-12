-- Script pour initialiser la base de données avec les données de test

-- Insérer les matières
INSERT INTO subjects (name, code, description) VALUES 
('Mathématiques', 'MATH', 'Enseignement des mathématiques'),
('Physique-Chimie', 'PC', 'Enseignement de la physique et chimie')
ON CONFLICT (code) DO NOTHING;

-- Insérer les niveaux
INSERT INTO levels (name, code, category) VALUES 
('1ère Année Collège', '1AC', 'college'),
('2ème Année Collège', '2AC', 'college'),
('3ème Année Collège', '3AC', 'college'),
('Tronc Commun', 'TC', 'lycee'),
('1ère Bac Sciences Physiques', 'BAC1_SP', 'lycee'),
('1ère Bac Sciences Mathématiques', 'BAC1_SM', 'lycee'),
('2ème Bac Sciences Physiques', 'BAC2_SP', 'lycee'),
('2ème Bac Sciences Mathématiques', 'BAC2_SM', 'lycee')
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

-- Insérer quelques classes de base
INSERT INTO classes (name, level_id, academic_year) VALUES 
('1AC A', 1, '2024-2025'),
('1AC B', 1, '2024-2025'),
('2AC A', 2, '2024-2025'),
('2AC B', 2, '2024-2025'),
('3AC A', 3, '2024-2025'),
('3AC B', 3, '2024-2025'),
('TC A', 4, '2024-2025'),
('TC B', 4, '2024-2025'),
('BAC1 SP A', 5, '2024-2025'),
('BAC1 SM A', 6, '2024-2025'),
('BAC2 SP A', 7, '2024-2025'),
('BAC2 SM A', 8, '2024-2025')
ON CONFLICT DO NOTHING;