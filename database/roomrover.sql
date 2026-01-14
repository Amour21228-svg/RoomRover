```sql
-- Création de la base de données
CREATE DATABASE IF NOT EXISTS roomrover;
USE roomrover;

-- Table des utilisateurs
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('tenant', 'owner', 'admin') NOT NULL,
    profile_picture VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des propriétés
CREATE TABLE properties (
    property_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    country VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    property_type ENUM('house', 'apartment', 'room', 'studio') NOT NULL,
    status ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table des chambres
CREATE TABLE rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    size INT COMMENT 'Size in m²',
    price DECIMAL(10, 2) NOT NULL,
    deposit_amount DECIMAL(10, 2) NOT NULL,
    bathroom_type ENUM('private', 'shared') NOT NULL,
    status ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

-- Table des équipements
CREATE TABLE amenities (
    amenity_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50)
);

-- Table de liaison chambre-équipements
CREATE TABLE room_amenities (
    room_id INT NOT NULL,
    amenity_id INT NOT NULL,
    PRIMARY KEY (room_id, amenity_id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE
);

-- Table des locations
CREATE TABLE rentals (
    rental_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    tenant_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_rent DECIMAL(10, 2) NOT NULL,
    deposit_paid BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'terminated', 'pending') NOT NULL,
    contract_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (tenant_id) REFERENCES users(user_id)
);

-- Table des paiements
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    rental_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('pending', 'paid', 'late', 'cancelled') NOT NULL,
    method ENUM('credit_card', 'bank_transfer', 'check', 'cash', 'moov_money', 'mtn_money', 'celtis_cash', 'wave', 'flooz'),
receipt_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rental_id) REFERENCES rentals(rental_id)
);

-- Table des messages
CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    rental_id INT,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES users(user_id),
    FOREIGN KEY (rental_id) REFERENCES rentals(rental_id)
);

-- Table des documents
CREATE TABLE documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    rental_id INT,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    type ENUM('contract', 'receipt', 'id', 'other') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (rental_id) REFERENCES rentals(rental_id)
);

-- Table des favoris
CREATE TABLE favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    UNIQUE KEY (user_id, room_id)
);

-- Table des avis
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    author_id INT NOT NULL,
    room_id INT NOT NULL,
    rental_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(user_id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (rental_id) REFERENCES rentals(rental_id)
);

-- Insertion des équipements de base
INSERT INTO amenities (name, icon) VALUES 
('Wi-Fi', 'wifi'),
('Cuisine équipée', 'utensils'),
('Lave-linge', 'shirt'),
('Climatisation', 'snowflake'),
('Chauffage', 'thermometer'),
('Parking', 'car'),
('Ascenseur', 'arrow-up'),
('Salle de sport', 'dumbbell'),
('Piscine', 'swimming-pool'),
('Jardin', 'tree');

-- Insertion d'un utilisateur admin
INSERT INTO users (first_name, last_name, email, password_hash, role, verified) 
VALUES ('Admin', 'System', 'admin@roomrover.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE);
```

Cette structure de base de données comprend toutes les tables nécessaires pour gérer :
- Les utilisateurs (locataires, propriétaires, administrateurs)
- Les propriétés et chambres
- Les équipements disponibles
- Les locations en cours
- Les paiements
- Les messages entre utilisateurs
- Les documents (contrats, reçus)
- Les favoris
- Les avis et notations

Le fichier inclut également des données initiales pour :
- Les types d'équipements courants
- Un compte administrateur par défaut
___METADATA_START___
{"repoId":"DevAmour/roomrover-your-smart-room-rental-companion","isNew":false,"userName":"DevAmour"}
___METADATA_END___