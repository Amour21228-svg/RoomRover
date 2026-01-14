/**
 * ✅ Flutterwave Payment Service
 * Intégration paiements mobiles: Moov, MTN, Celtis (Afrique)
 */

class FlutterwaveService {
  constructor(publicKey, secretKey) {
    this.publicKey = publicKey || 'FLWPUBK_TEST_demo';
    this.secretKey = secretKey || 'FLWSECK_TEST_demo';
    this.transactions = new Map();
    this.transfers = new Map();
  }

  /**
   * Initier paiement (redirection vers Flutterwave)
   */
  async initiatePayment(amount, email, fullName, description, metadata = {}) {
    const txRef = `RR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      tx_ref: txRef,
      amount,
      currency: 'XOF', // Franc CFA (Bénin, Sénégal, etc.)
      redirect_url: metadata.redirectUrl || 'http://localhost:8080/payment-callback',
      customer: {
        email,
        name: fullName,
        phonenumber: metadata.phone || '',
      },
      customizations: {
        title: 'RoomRover Paiement Location',
        description: description || 'Paiement location immobilière',
        logo: 'https://roomrover.example.com/logo.png',
      },
      meta: {
        type: metadata.type || 'rental', // rental, deposit, subscription
        propertyId: metadata.propertyId || '',
        rentalId: metadata.rentalId || '',
      },
    };

    // Simuler réponse Flutterwave
    const paymentLink = `https://checkout.flutterwave.com/pay/${txRef}`;

    const transaction = {
      tx_ref: txRef,
      status: 'new',
      amount,
      currency: 'XOF',
      customer_email: email,
      customer_name: fullName,
      payment_link: paymentLink,
      created_at: new Date(),
      metadata,
    };

    this.transactions.set(txRef, transaction);

    console.log(`✅ Flutterwave payment initiated: ${txRef}`);
    return {
      data: {
        link: paymentLink,
        status: 'success',
      },
      message: 'Paiement initié avec succès',
    };
  }

  /**
   * Vérifier le statut du paiement
   */
  async verifyPayment(txRef) {
    const transaction = this.transactions.get(txRef);

    if (!transaction) {
      throw new Error(`Transaction ${txRef} not found`);
    }

    // Simuler vérification - simuler succès ou échec
    // En production, appel API réel à Flutterwave
    const isSuccessful = Math.random() > 0.1; // 90% succès

    if (isSuccessful) {
      transaction.status = 'successful';
      transaction.verified_at = new Date();
      transaction.flutterwave_ref = `FLWREF-${Date.now()}`;
    } else {
      transaction.status = 'failed';
      transaction.failure_reason = 'Insufficient funds';
    }

    this.transactions.set(txRef, transaction);

    return {
      data: transaction,
      status: transaction.status === 'successful' ? 'success' : 'error',
      message: transaction.status === 'successful' 
        ? 'Paiement vérifié' 
        : 'Paiement échoué',
    };
  }

  /**
   * Créer un transfert (remboursement)
   */
  async initiateTransfer(amount, accountBank, accountNumber, currency = 'XOF', metadata = {}) {
    const transferId = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const transfer = {
      id: transferId,
      account_bank: accountBank, // Code banque (e.g., '011')
      account_number: accountNumber,
      amount,
      currency,
      narration: metadata.narration || 'RoomRover Refund',
      reference: `REFUND-${Date.now()}`,
      status: 'new',
      created_at: new Date(),
      metadata,
    };

    // Simuler validité du compte
    if (!/^\d{10,13}$/.test(accountNumber)) {
      throw new Error('Numéro de compte invalide');
    }

    this.transfers.set(transferId, transfer);

    console.log(`✅ Transfer initiated: ${transferId}`);
    return {
      data: transfer,
      message: 'Transfert initié avec succès',
    };
  }

  /**
   * Vérifier statut du transfert
   */
  async getTransferStatus(transferId) {
    const transfer = this.transfers.get(transferId);

    if (!transfer) {
      throw new Error(`Transfer ${transferId} not found`);
    }

    // Simuler: transferts réussissent généralement
    transfer.status = Math.random() > 0.15 ? 'successful' : 'failed';
    transfer.completed_at = new Date();

    return transfer;
  }

  /**
   * Obtenir historique paiements (pour admin)
   */
  getPaymentHistory(limit = 100, filters = {}) {
    let transactions = Array.from(this.transactions.values());

    // Appliquer filtres
    if (filters.status) {
      transactions = transactions.filter(t => t.status === filters.status);
    }
    if (filters.email) {
      transactions = transactions.filter(t => 
        t.customer_email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    if (filters.dateFrom) {
      transactions = transactions.filter(t => new Date(t.created_at) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      transactions = transactions.filter(t => new Date(t.created_at) <= new Date(filters.dateTo));
    }

    // Trier par date décroissante
    transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return transactions.slice(0, limit);
  }

  /**
   * Obtenir statistiques paiements
   */
  getPaymentStats() {
    const transactions = Array.from(this.transactions.values());
    
    const stats = {
      total_transactions: transactions.length,
      total_amount: transactions.reduce((sum, t) => sum + t.amount, 0),
      successful: transactions.filter(t => t.status === 'successful').length,
      failed: transactions.filter(t => t.status === 'failed').length,
      pending: transactions.filter(t => t.status === 'new').length,
      average_amount: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
        : 0,
    };

    return stats;
  }

  /**
   * Simuler webhook Flutterwave
   */
  handleWebhook(event) {
    console.log(`✅ Webhook Flutterwave: ${event.event} pour ${event.data.tx_ref}`);
    
    const txRef = event.data.tx_ref;
    const transaction = this.transactions.get(txRef);

    if (transaction) {
      if (event.event === 'successful') {
        transaction.status = 'successful';
      } else if (event.event === 'failed') {
        transaction.status = 'failed';
      }
    }

    return { success: true };
  }

  /**
   * Lister les moyens de paiement disponibles (mobile money)
   */
  getPaymentMethods() {
    return {
      mobile_money: [
        { id: 'mtn_ci', name: 'MTN Money', country: 'Côte d\'Ivoire', currency: 'XOF' },
        { id: 'moov_ci', name: 'Moov Money', country: 'Côte d\'Ivoire', currency: 'XOF' },
        { id: 'orange_ci', name: 'Orange Money', country: 'Côte d\'Ivoire', currency: 'XOF' },
        { id: 'wave_sn', name: 'Wave', country: 'Sénégal', currency: 'XOF' },
        { id: 'airtel_sn', name: 'Airtel Money', country: 'Sénégal', currency: 'XOF' },
      ],
      card: {
        supported: true,
        currencies: ['XOF', 'USD', 'EUR'],
      },
      bank_transfer: {
        supported: true,
        required_fields: ['account_bank', 'account_number', 'amount'],
      },
    };
  }
}

// Créer instance singleton
const flutterwaveService = new FlutterwaveService(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
);

module.exports = flutterwaveService;
