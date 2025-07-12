-- Script complet pour corriger l'interface Niveaux en local
-- Exécuter avec: psql -U yassine -d edutrack -f complete_interface_fix.sql

BEGIN;

-- 1. Nettoyer et recréer la structure des niveaux
DROP TABLE IF EXISTS levels CASCADE;
CREATE TABLE levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('college', 'lycee')),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 2. Insérer les niveaux de test
INSERT INTO levels (name, code, category, "createdAt", "updatedAt") VALUES
('1ère Année Collège', '1AC', 'college', NOW(), NOW()),
('2ème Année Collège', '2AC', 'college', NOW(), NOW()),
('3ème Année Collège', '3AC', 'college', NOW(), NOW()),
('Tronc Commun', 'TC', 'lycee', NOW(), NOW()),
('1ère Année Bac', '1BAC', 'lycee', NOW(), NOW()),
('2ème Année Bac', '2BAC', 'lycee', NOW(), NOW());

-- 3. Vérifier/créer la table subjects
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 4. Insérer des matières de base
INSERT INTO subjects (name, code, description, "createdAt", "updatedAt") VALUES
('Mathématiques', 'MATH', 'Matière de mathématiques', NOW(), NOW()),
('Physique-Chimie', 'PC', 'Matière de physique-chimie', NOW(), NOW()),
('Français', 'FR', 'Matière de français', NOW(), NOW()),
('Arabe', 'AR', 'Matière d''arabe', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    "updatedAt" = NOW();

-- 5. Créer/vérifier le compte admin
INSERT INTO users (username, password, role, "firstName", "lastName", email, "createdAt", "updatedAt")
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQnHO8tOe.VyAoHYNJ7F4tJYCYqrCY5D1YkP.0o6G', 'admin', 'Admin', 'System', 'admin@edutrack.com', NOW(), NOW())
ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    email = EXCLUDED.email,
    "updatedAt" = NOW();

COMMIT;

-- 6. Vérifier les données créées
SELECT 'CONFIGURATION TERMINÉE' AS status;
SELECT 'Niveaux créés:' AS info;
SELECT id, name, code, category FROM levels ORDER BY category, name;

SELECT 'Matières créées:' AS info;
SELECT id, name, code FROM subjects ORDER BY name;

SELECT 'Compte admin:' AS info;
SELECT username, role, "firstName", "lastName" FROM users WHERE role = 'admin';

SELECT 'Instructions:' AS info;
SELECT '1. Redémarrez votre serveur: npm run dev' AS etape;
SELECT '2. Connectez-vous avec admin / 123456' AS etape;
SELECT '3. Allez dans Dashboard Admin' AS etape;
SELECT '4. Cliquez sur l''onglet Niveaux (3ème onglet)' AS etape;