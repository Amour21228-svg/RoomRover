/**
 * ✅ Stripe Payment Service
 * Gestion complète des paiements Stripe
 */

// Mock Stripe Service (pour démo sans dépendance)
class StripeService {
  constructor(secretKey) {
    this.secretKey = secretKey || 'sk_test_demo_key';
    this.payments = new Map();
    this.webhookLog = [];
  }

  /**
   * Créer une intention de paiement
   */
  async createPaymentIntent(amount, currency = 'eur', metadata = {}) {
    const intentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentIntent = {
      id: intentId,
      object: 'payment_intent',
      amount: Math.round(amount * 100), // en cents
      currency,
      status: 'requires_payment_method',
      client_secret: `${intentId}_secret_${Math.random().toString(36).substr(2, 20)}`,
      metadata,
      created: new Date(),
      charges: [],
    };

    this.payments.set(intentId, paymentIntent);

    console.log(`✅ Payment Intent créé: ${intentId}`);
    return paymentIntent;
  }

  /**
   * Récupérer une intention de paiement
   */
  async getPaymentIntent(intentId) {
    return this.payments.get(intentId) || null;
  }

  /**
   * Confirmer un paiement
   */
  async confirmPayment(intentId, paymentMethod = {}) {
    const intent = this.payments.get(intentId);
    
    if (!intent) {
      throw new Error(`Payment Intent ${intentId} not found`);
    }

    // Simuler succès 95% du temps
    const success = Math.random() > 0.05;

    if (success) {
      intent.status = 'succeeded';
      intent.charges.push({
        id: `ch_${Date.now()}`,
        object: 'charge',
        amount: intent.amount,
        currency: intent.currency,
        status: 'succeeded',
        paid: true,
        created: new Date(),
      });
    } else {
      intent.status = 'requires_action';
    }

    this.payments.set(intentId, intent);
    return intent;
  }

  /**
   * Créer un client
   */
  async createCustomer(email, name, metadata = {}) {
    const customerId = `cus_${Date.now()}`;
    
    const customer = {
      id: customerId,
      object: 'customer',
      email,
      name,
      description: metadata.description || '',
      metadata,
      created: new Date(),
    };

    return customer;
  }

  /**
   * Créer une souscription récurrente
   */
  async createSubscription(customerId, priceId, metadata = {}) {
    const subscriptionId = `sub_${Date.now()}`;
    
    const subscription = {
      id: subscriptionId,
      object: 'subscription',
      customer: customerId,
      price: priceId,
      status: 'active',
      billing_cycle_anchor: new Date(),
      metadata,
      created: new Date(),
    };

    return subscription;
  }

  /**
   * Créer un remboursement
   */
  async createRefund(chargeId, amount = null) {
    const refundId = `re_${Date.now()}`;
    
    const refund = {
      id: refundId,
      object: 'refund',
      charge: chargeId,
      amount,
      status: 'succeeded',
      created: new Date(),
      reason: 'requested_by_customer',
    };

    console.log(`✅ Refund créé: ${refundId} pour ${chargeId}`);
    return refund;
  }

  /**
   * Logger webhook Stripe
   */
  logWebhook(event) {
    this.webhookLog.push({
      eventId: event.id,
      type: event.type,
      timestamp: new Date(),
      data: event.data.object,
    });
    
    console.log(`✅ Webhook Stripe: ${event.type}`);
  }

  /**
   * Obtenir tous les paiements (pour admin)
   */
  getAllPayments() {
    return Array.from(this.payments.values());
  }

  /**
   * Obtenir les logs webhook
   */
  getWebhookLogs(limit = 50) {
    return this.webhookLog.slice(-limit);
  }
}

// Créer instance singleton
const stripeService = new StripeService(process.env.STRIPE_SECRET_KEY);

module.exports = stripeService;
