#!/usr/bin/env node

/**
 * PHASE 5 - Automated Testing Suite
 * Tests all critical flows: Auth, RBAC, API, Security
 */

const http = require('http');

const BASE_URL = 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testUsers = {
  tenant: {
    email: 'locataire@test.com',
    password: 'password123',
    firstName: 'Thomas',
    lastName: 'Martin',
    role: 'tenant',
    expectedDashboard: '/tenant.html'
  },
  owner: {
    email: 'proprietaire@test.com',
    password: 'password123',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'owner',
    expectedDashboard: '/owner.html'
  },
  admin: {
    email: 'admin@roomrover.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'System',
    role: 'admin',
    expectedDashboard: '/admin.html'
  }
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// HTTP helper
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.status || res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.status || res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test helper
async function test(name, fn) {
  try {
    await fn();
    testResults.passed++;
    testResults.tests.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: `❌ FAIL: ${error.message}` });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

// Assert helper
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Run tests
async function runTests() {
  console.log('\n╔════════════════════════════════════╗');
  console.log('║  🧪 PHASE 5 - Testing Suite       ║');
  console.log('╚════════════════════════════════════╝\n');

  // TEST 1: CSRF Token Endpoint
  await test('GET /api/csrf-token returns tokens', async () => {
    const res = await makeRequest('GET', '/api/csrf-token');
    assert(res.status === 200, 'Status should be 200');
    assert(res.body.csrfToken, 'Should have csrfToken');
    assert(res.body.sessionId, 'Should have sessionId');
  });

  // TEST 2: Login with Tenant
  let tenantToken, tenantUser;
  await test('POST /api/auth/login - Tenant login', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: testUsers.tenant.email,
      password: testUsers.tenant.password
    });
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.body.token, 'Should return JWT token');
    assert(res.body.user.role === 'tenant', 'User should have tenant role');
    tenantToken = res.body.token;
    tenantUser = res.body.user;
  });

  // TEST 3: Login with Owner
  let ownerToken, ownerUser;
  await test('POST /api/auth/login - Owner login', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: testUsers.owner.email,
      password: testUsers.owner.password
    });
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.body.token, 'Should return JWT token');
    assert(res.body.user.role === 'owner', 'User should have owner role');
    ownerToken = res.body.token;
    ownerUser = res.body.user;
  });

  // TEST 4: Login with Admin
  let adminToken, adminUser;
  await test('POST /api/auth/login - Admin login', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: testUsers.admin.email,
      password: testUsers.admin.password
    });
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.body.token, 'Should return JWT token');
    assert(res.body.user.role === 'admin', 'User should have admin role');
    adminToken = res.body.token;
    adminUser = res.body.user;
  });

  // TEST 5: Tenant can access properties
  await test('GET /api/properties - Tenant access', async () => {
    const res = await makeRequest('GET', '/api/properties', null, {
      'Authorization': `Bearer ${tenantToken}`
    });
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(Array.isArray(res.body), 'Should return array of properties');
  });

  // TEST 6: Owner can access own properties
  await test('GET /api/owner/properties - Owner access', async () => {
    const res = await makeRequest('GET', '/api/owner/properties', null, {
      'Authorization': `Bearer ${ownerToken}`
    });
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(Array.isArray(res.body), 'Should return array of properties');
  });

  // TEST 7: Admin can access all users
  await test('GET /api/admin/users - Admin access', async () => {
    const res = await makeRequest('GET', '/api/admin/users', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(Array.isArray(res.body), 'Should return array of users');
  });

  // TEST 8: Tenant cannot access admin routes
  await test('GET /api/admin/users - Tenant denied', async () => {
    const res = await makeRequest('GET', '/api/admin/users', null, {
      'Authorization': `Bearer ${tenantToken}`
    });
    assert(res.status === 403, `Status should be 403, got ${res.status}`);
  });

  // TEST 9: Invalid token rejected
  await test('Invalid JWT token - Request rejected', async () => {
    const res = await makeRequest('GET', '/api/owner/properties', null, {
      'Authorization': 'Bearer invalid.token.here'
    });
    assert(res.status === 401, `Status should be 401, got ${res.status}`);
  });

  // TEST 10: Email validation endpoint
  await test('POST /api/validate/email - Valid email', async () => {
    const res = await makeRequest('POST', '/api/validate/email', {
      email: 'newuser@example.com'
    });
    assert(res.status === 200, 'Status should be 200');
    assert(res.body.valid === true, 'Email should be valid');
  });

  // TEST 11: Email already exists
  await test('POST /api/validate/email - Duplicate email', async () => {
    const res = await makeRequest('POST', '/api/validate/email', {
      email: testUsers.tenant.email
    });
    assert(res.status === 200, 'Status should be 200');
    assert(res.body.valid === false, 'Email should be marked as invalid (exists)');
  });

  // TEST 12: Wrong password rejected
  await test('POST /api/auth/login - Wrong password', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: testUsers.tenant.email,
      password: 'wrongpassword'
    });
    assert(res.status === 401, `Status should be 401, got ${res.status}`);
  });

  // TEST 13: Non-existent user
  await test('POST /api/auth/login - Non-existent user', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'password123'
    });
    assert(res.status === 401, `Status should be 401, got ${res.status}`);
  });

  // TEST 14: Get user stats
  await test('GET /api/tenant/stats - Tenant stats', async () => {
    const res = await makeRequest('GET', '/api/tenant/stats', null, {
      'Authorization': `Bearer ${tenantToken}`
    });
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.body.rentalsCount !== undefined, 'Should have rentalsCount');
  });

  // TEST 15: Owner stats
  await test('GET /api/owner/stats - Owner stats', async () => {
    const res = await makeRequest('GET', '/api/owner/stats', null, {
      'Authorization': `Bearer ${ownerToken}`
    });
    assert(res.status === 200, `Status should be 200, got ${res.status}`);
    assert(res.body.propertiesCount !== undefined, 'Should have propertiesCount');
  });

  // Print Results
  console.log('\n╔════════════════════════════════════╗');
  console.log('║  📊 Test Results                  ║');
  console.log('╚════════════════════════════════════╝\n');

  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%\n`);

  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Application is production-ready.\n');
  } else {
    console.log('⚠️ Some tests failed. Review the errors above.\n');
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run
runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
