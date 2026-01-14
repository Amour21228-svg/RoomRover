/**
 * ✅ Phase 3 Automated Tests
 * Run: node test-phase3.js
 */

const stripeService = require('./lib/stripe-service');
const flutterwaveService = require('./lib/flutterwave-service');
const twoFactorService = require('./lib/2fa-service');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let testsPassed = 0;
let testsFailed = 0;

function pass(message) {
  console.log(`${colors.green}✅ PASS${colors.reset} ${message}`);
  testsPassed++;
}

function fail(message, error) {
  console.log(`${colors.red}❌ FAIL${colors.reset} ${message}`);
  if (error) console.log(`   ${error}`);
  testsFailed++;
}

function test(name) {
  console.log(`\n${colors.bright}${colors.blue}📝 ${name}${colors.reset}`);
}

function section(name) {
  console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${name}${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
}

// ==================== TESTS START ====================

section('🚀 PHASE 3 - AUTOMATED TESTS');

// ==================== STRIPE TESTS ====================

section('💳 STRIPE PAYMENT SERVICE');

test('Create Payment Intent');
(async () => {
  try {
    const intent = await stripeService.createPaymentIntent(50, 'eur', {
      userId: 1,
      type: 'rent',
    });

    if (intent.id && intent.client_secret && intent.status === 'requires_payment_method') {
      pass(`Payment Intent created: ${intent.id}`);
      console.log(`   Amount: €${intent.amount / 100}`);
      console.log(`   Currency: ${intent.currency}`);
      console.log(`   Status: ${intent.status}`);
    } else {
      fail('Payment Intent creation failed');
    }
  } catch (error) {
    fail('Payment Intent creation error', error.message);
  }
})();

test('Retrieve Payment Intent');
(async () => {
  try {
    const intent = await stripeService.createPaymentIntent(25, 'eur');
    const retrieved = await stripeService.getPaymentIntent(intent.id);

    if (retrieved && retrieved.id === intent.id) {
      pass(`Payment Intent retrieved: ${retrieved.id}`);
    } else {
      fail('Payment Intent retrieval failed');
    }
  } catch (error) {
    fail('Payment Intent retrieval error', error.message);
  }
})();

test('Confirm Payment');
(async () => {
  try {
    const intent = await stripeService.createPaymentIntent(100, 'eur');
    const confirmed = await stripeService.confirmPayment(intent.id, { tokenId: 'test' });

    if (confirmed.status === 'succeeded' && confirmed.charges.length > 0) {
      pass(`Payment confirmed: ${confirmed.charges[0].id}`);
      console.log(`   Status: ${confirmed.status}`);
      console.log(`   Charge Amount: €${confirmed.charges[0].amount / 100}`);
    } else {
      fail('Payment confirmation failed');
    }
  } catch (error) {
    fail('Payment confirmation error', error.message);
  }
})();

test('Create Refund');
(async () => {
  try {
    const intent = await stripeService.createPaymentIntent(75, 'eur');
    const confirmed = await stripeService.confirmPayment(intent.id);
    const chargeId = confirmed.charges[0].id;

    const refund = await stripeService.createRefund(chargeId, 7500);

    if (refund.id && refund.status === 'succeeded') {
      pass(`Refund created: ${refund.id}`);
      console.log(`   Amount: €${refund.amount / 100}`);
      console.log(`   Status: ${refund.status}`);
    } else {
      fail('Refund creation failed');
    }
  } catch (error) {
    fail('Refund creation error', error.message);
  }
})();

test('Get All Payments (Admin)');
(async () => {
  try {
    // Create multiple payments
    for (let i = 0; i < 3; i++) {
      await stripeService.createPaymentIntent(Math.random() * 100, 'eur');
    }

    const payments = stripeService.getAllPayments();

    if (payments.length >= 3) {
      pass(`Payments retrieved: ${payments.length} total`);
      console.log(`   First payment: €${payments[0].amount / 100}`);
    } else {
      fail('Payments retrieval failed');
    }
  } catch (error) {
    fail('Payments retrieval error', error.message);
  }
})();

// ==================== FLUTTERWAVE TESTS ====================

section('📱 FLUTTERWAVE PAYMENT SERVICE');

test('Initiate Mobile Money Payment');
(async () => {
  try {
    const result = await flutterwaveService.initiatePayment(
      25000,
      'tenant@test.com',
      'Test Tenant',
      'Monthly rent payment'
    );

    if (result.data.link && result.data.link.includes('checkout.flutterwave')) {
      pass(`Mobile money payment initiated`);
      console.log(`   Amount: XOF 25,000`);
      console.log(`   Link: ${result.data.link.substring(0, 50)}...`);
    } else {
      fail('Mobile money payment initiation failed');
    }
  } catch (error) {
    fail('Mobile money payment error', error.message);
  }
})();

test('Verify Payment Status');
(async () => {
  try {
    const initiated = await flutterwaveService.initiatePayment(
      15000,
      'user@test.com',
      'Test User',
      'Payment'
    );
    const txRef = initiated.data.link.split('=')[1];

    const verification = await flutterwaveService.verifyPayment(txRef);

    if (verification.data.status) {
      pass(`Payment verified: ${verification.data.status}`);
      console.log(`   Transaction Ref: ${verification.data.tx_ref}`);
    } else {
      fail('Payment verification failed');
    }
  } catch (error) {
    fail('Payment verification error', error.message);
  }
})();

test('Create Bank Transfer (Refund)');
(async () => {
  try {
    const transfer = await flutterwaveService.initiateTransfer(
      10000,
      '011', // Bank code (Benin)
      '1234567890', // Account number
      'XOF'
    );

    if (transfer.data.id) {
      pass(`Bank transfer initiated: ${transfer.data.id}`);
      console.log(`   Amount: XOF ${transfer.data.amount}`);
      console.log(`   Account: ${transfer.data.account_number}`);
    } else {
      fail('Bank transfer initiation failed');
    }
  } catch (error) {
    fail('Bank transfer error', error.message);
  }
})();

test('Get Payment Methods');
(async () => {
  try {
    const methods = flutterwaveService.getPaymentMethods();

    if (methods.mobile_money && methods.mobile_money.length > 0) {
      pass(`Payment methods retrieved: ${methods.mobile_money.length} mobile money providers`);
      console.log(`   Methods: ${methods.mobile_money.map(m => m.name).join(', ')}`);
    } else {
      fail('Payment methods retrieval failed');
    }
  } catch (error) {
    fail('Payment methods error', error.message);
  }
})();

test('Get Payment Statistics');
(async () => {
  try {
    // Create multiple payments
    for (let i = 0; i < 5; i++) {
      await flutterwaveService.initiatePayment(
        Math.random() * 50000,
        `user${i}@test.com`,
        `User ${i}`,
        `Payment ${i}`
      );
    }

    const stats = flutterwaveService.getPaymentStats();

    if (stats.total_transactions >= 5) {
      pass(`Payment statistics calculated`);
      console.log(`   Total transactions: ${stats.total_transactions}`);
      console.log(`   Total amount: XOF ${stats.total_amount}`);
      console.log(`   Average: XOF ${Math.round(stats.average_amount)}`);
    } else {
      fail('Payment statistics failed');
    }
  } catch (error) {
    fail('Payment statistics error', error.message);
  }
})();

// ==================== 2FA TESTS ====================

section('🔐 TWO-FACTOR AUTHENTICATION SERVICE');

test('Generate 2FA Secret');
(async () => {
  try {
    const secret = twoFactorService.generateSecret('admin@roomrover.com');

    if (secret.secret && secret.otpauth_url && secret.backup_codes.length === 10) {
      pass(`2FA secret generated`);
      console.log(`   Secret length: ${secret.secret.length} chars`);
      console.log(`   Backup codes: ${secret.backup_codes.length}`);
      console.log(`   Sample codes: ${secret.backup_codes.slice(0, 2).join(', ')}`);
    } else {
      fail('2FA secret generation failed');
    }
  } catch (error) {
    fail('2FA secret generation error', error.message);
  }
})();

test('Enable 2FA for User');
(async () => {
  try {
    const secret = twoFactorService.generateSecret('admin@test.com');
    const result = twoFactorService.enableTwoFactor('admin1', secret.secret, secret.backup_codes);

    if (result.success && twoFactorService.isTwoFactorEnabled('admin1')) {
      pass(`2FA enabled for user admin1`);
      console.log(`   Status: enabled`);
    } else {
      fail('2FA enablement failed');
    }
  } catch (error) {
    fail('2FA enablement error', error.message);
  }
})();

test('Verify TOTP Token');
(async () => {
  try {
    const secret = twoFactorService.generateSecret('test@test.com');
    twoFactorService.enableTwoFactor('admin2', secret.secret, secret.backup_codes);

    // Note: TOTP tokens change every 30 seconds, so verification is time-dependent
    // This test just checks that the method doesn't crash
    const token = '000000'; // Invalid token (just testing method)
    const verified = twoFactorService.verifyToken(token, secret.secret);

    // Expected: should return false for invalid token
    if (!verified) {
      pass(`TOTP verification working (rejected invalid token)`);
    } else {
      fail('TOTP verification should reject invalid token');
    }
  } catch (error) {
    fail('TOTP verification error', error.message);
  }
})();

test('Use Backup Code');
(async () => {
  try {
    const secret = twoFactorService.generateSecret('backup@test.com');
    const codes = secret.backup_codes;
    twoFactorService.enableTwoFactor('admin3', secret.secret, codes);

    const result = twoFactorService.useBackupCode('admin3', codes[0]);

    if (result.valid && result.remaining_codes === 9) {
      pass(`Backup code used successfully`);
      console.log(`   Remaining codes: ${result.remaining_codes}`);
      console.log(`   Message: ${result.message}`);
    } else {
      fail('Backup code usage failed');
    }
  } catch (error) {
    fail('Backup code usage error', error.message);
  }
})();

test('Get 2FA Status');
(async () => {
  try {
    const secret = twoFactorService.generateSecret('status@test.com');
    twoFactorService.enableTwoFactor('admin4', secret.secret, secret.backup_codes);

    const status = twoFactorService.getUserTwoFactorStatus('admin4');

    if (status.enabled && status.backup_codes_remaining === 10) {
      pass(`2FA status retrieved`);
      console.log(`   Enabled: ${status.enabled}`);
      console.log(`   Backup codes: ${status.backup_codes_remaining}`);
    } else {
      fail('2FA status retrieval failed');
    }
  } catch (error) {
    fail('2FA status retrieval error', error.message);
  }
})();

test('Disable 2FA');
(async () => {
  try {
    const secret = twoFactorService.generateSecret('disable@test.com');
    twoFactorService.enableTwoFactor('admin5', secret.secret, secret.backup_codes);
    const result = twoFactorService.disableTwoFactor('admin5');

    if (result.success && !twoFactorService.isTwoFactorEnabled('admin5')) {
      pass(`2FA disabled successfully`);
    } else {
      fail('2FA disable failed');
    }
  } catch (error) {
    fail('2FA disable error', error.message);
  }
})();

test('Regenerate Backup Codes');
(async () => {
  try {
    const secret = twoFactorService.generateSecret('regen@test.com');
    const originalCodes = secret.backup_codes;
    twoFactorService.enableTwoFactor('admin6', secret.secret, originalCodes);

    // Use one code
    twoFactorService.useBackupCode('admin6', originalCodes[0]);

    // Regenerate
    const result = twoFactorService.regenerateBackupCodes('admin6');

    if (result.backup_codes.length === 10) {
      pass(`Backup codes regenerated`);
      console.log(`   New codes: ${result.backup_codes.length}`);
    } else {
      fail('Backup code regeneration failed');
    }
  } catch (error) {
    fail('Backup code regeneration error', error.message);
  }
})();

// ==================== FINAL SUMMARY ====================

setTimeout(() => {
  section('📊 TEST SUMMARY');

  const total = testsPassed + testsFailed;
  const percentage = total > 0 ? Math.round((testsPassed / total) * 100) : 0;

  console.log(`\n${colors.green}✅ Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testsFailed}${colors.reset}`);
  console.log(`${colors.bright}📈 Total: ${total}${colors.reset}`);
  console.log(`${colors.bright}🎯 Success Rate: ${percentage}%${colors.reset}\n`);

  if (testsFailed === 0) {
    console.log(`${colors.green}${colors.bright}🎉 ALL TESTS PASSED! Phase 3 services ready!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠️  Some tests failed. Review above.${colors.reset}\n`);
    process.exit(1);
  }
}, 2000);
