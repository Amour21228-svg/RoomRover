// lib/database.js - In-Memory Database for Development
// Production: Replace with MySQL/PostgreSQL

const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    // Users
    this.users = [
      {
        id: 1,
        email: 'locataire@test.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        password: bcrypt.hashSync('password123', 10),
        role: 'tenant',
        phone: '0612345678',
        verified: true,
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 2,
        email: 'proprietaire@test.com',
        firstName: 'Marie',
        lastName: 'Martin',
        password: bcrypt.hashSync('password123', 10),
        role: 'owner',
        phone: '0687654321',
        verified: true,
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 3,
        email: 'admin@roomrover.com',
        firstName: 'Admin',
        lastName: 'System',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        phone: '0700000000',
        verified: true,
        createdAt: new Date('2026-01-01'),
      },
    ];

    // Properties
    this.properties = [
      {
        id: 1,
        ownerId: 2,
        title: 'Chambre Lumineuse - Paris 16',
        description: 'Belle chambre moderne proche du métro',
        price: 450,
        city: 'Paris',
        address: '12 Rue du Parc, 75016',
        bedrooms: 1,
        bathrooms: 1,
        area: 18,
        amenities: ['Wi-Fi', 'Climatisation', 'Chauffage'],
        images: ['property-1.jpg'],
        status: 'available',
        createdAt: new Date('2026-01-05'),
      },
      {
        id: 2,
        ownerId: 2,
        title: 'Studio Cosy - Marais',
        description: 'Studio cosy au cœur du Marais',
        price: 550,
        city: 'Paris',
        address: '45 Rue des Tournelles, 75004',
        bedrooms: 1,
        bathrooms: 1,
        area: 25,
        amenities: ['Wi-Fi', 'Cuisine équipée'],
        images: ['property-2.jpg'],
        status: 'available',
        createdAt: new Date('2026-01-06'),
      },
    ];

    // Rentals (locations en cours)
    this.rentals = [
      {
        id: 1,
        propertyId: 1,
        tenantId: 1,
        ownerId: 2,
        startDate: new Date('2025-12-01'),
        endDate: new Date('2026-06-30'),
        monthlyPrice: 450,
        deposit: 900,
        depositPaid: true,
        status: 'active',
        createdAt: new Date('2025-12-01'),
      },
    ];

    // Payments (paiements)
    this.payments = [
      {
        id: 1,
        rentalId: 1,
        userId: 1,
        amount: 450,
        method: 'moov_money',
        status: 'completed',
        transactionId: 'TRX-2025-12-001',
        month: '2025-12',
        createdAt: new Date('2025-12-05'),
      },
    ];

    // Messages
    this.messages = [];

    // Documents (contrats, reçus)
    this.documents = [
      {
        id: 1,
        rentalId: 1,
        type: 'contract',
        fileName: 'contrat-location-2025-12.pdf',
        url: '/documents/contrat-location-2025-12.pdf',
        createdAt: new Date('2025-12-01'),
      },
    ];

    this.nextUserId = 4;
    this.nextPropertyId = 3;
    this.nextRentalId = 2;
    this.nextPaymentId = 2;
    this.nextMessageId = 1;
    this.nextDocumentId = 2;
  }

  // ==================== USER METHODS ====================

  findUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.users.find(u => u.id === id);
  }

  createUser(userData) {
    const newUser = {
      id: this.nextUserId++,
      ...userData,
      password: bcrypt.hashSync(userData.password, 10),
      verified: false,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  // ==================== PROPERTY METHODS ====================

  findProperties(filters = {}) {
    let results = this.properties;

    if (filters.city) {
      results = results.filter(p => p.city.toLowerCase().includes(filters.city.toLowerCase()));
    }
    if (filters.ownerId) {
      results = results.filter(p => p.ownerId === filters.ownerId);
    }
    if (filters.minPrice) {
      results = results.filter(p => p.price >= filters.minPrice);
    }
    if (filters.maxPrice) {
      results = results.filter(p => p.price <= filters.maxPrice);
    }
    if (filters.status) {
      results = results.filter(p => p.status === filters.status);
    }

    return results;
  }

  findPropertyById(id) {
    return this.properties.find(p => p.id === id);
  }

  createProperty(propertyData) {
    const newProperty = {
      id: this.nextPropertyId++,
      ...propertyData,
      status: 'available',
      createdAt: new Date(),
    };
    this.properties.push(newProperty);
    return newProperty;
  }

  updateProperty(id, updates) {
    const property = this.findPropertyById(id);
    if (property) {
      Object.assign(property, updates, { updatedAt: new Date() });
    }
    return property;
  }

  deleteProperty(id) {
    this.properties = this.properties.filter(p => p.id !== id);
  }

  // ==================== RENTAL METHODS ====================

  findRentals(filters = {}) {
    let results = this.rentals;

    if (filters.tenantId) {
      results = results.filter(r => r.tenantId === filters.tenantId);
    }
    if (filters.ownerId) {
      results = results.filter(r => r.ownerId === filters.ownerId);
    }
    if (filters.status) {
      results = results.filter(r => r.status === filters.status);
    }

    return results;
  }

  findRentalById(id) {
    return this.rentals.find(r => r.id === id);
  }

  createRental(rentalData) {
    const newRental = {
      id: this.nextRentalId++,
      ...rentalData,
      status: 'active',
      createdAt: new Date(),
    };
    this.rentals.push(newRental);
    return newRental;
  }

  // ==================== PAYMENT METHODS ====================

  findPayments(filters = {}) {
    let results = this.payments;

    if (filters.userId) {
      results = results.filter(p => p.userId === filters.userId);
    }
    if (filters.rentalId) {
      results = results.filter(p => p.rentalId === filters.rentalId);
    }
    if (filters.status) {
      results = results.filter(p => p.status === filters.status);
    }

    return results;
  }

  recordPayment(paymentData) {
    const newPayment = {
      id: this.nextPaymentId++,
      ...paymentData,
      createdAt: new Date(),
    };
    this.payments.push(newPayment);
    return newPayment;
  }

  // ==================== MESSAGE METHODS ====================

  findMessages(filters = {}) {
    let results = this.messages;

    if (filters.senderId) {
      results = results.filter(m => m.senderId === filters.senderId);
    }
    if (filters.recipientId) {
      results = results.filter(m => m.recipientId === filters.recipientId);
    }

    return results;
  }

  createMessage(messageData) {
    const newMessage = {
      id: this.nextMessageId++,
      ...messageData,
      createdAt: new Date(),
    };
    this.messages.push(newMessage);
    return newMessage;
  }

  // ==================== UTILITY ====================

  getAllStats() {
    return {
      totalUsers: this.users.length,
      totalProperties: this.properties.length,
      totalRentals: this.rentals.length,
      totalPayments: this.payments.length,
      totalRevenue: this.payments.reduce((sum, p) => sum + p.amount, 0),
    };
  }
}

module.exports = new Database();
