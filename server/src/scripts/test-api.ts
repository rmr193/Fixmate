import assert from 'assert';
import { Server } from 'http';
import { createApp } from '../index';
import { closeDB } from '../config/db';
import { seedDatabase } from './seed';

const TEST_PORT = 5055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function apiRequest(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  const json = (await res.json()) as Record<string, any>;
  return { status: res.status, json };
}

async function runTests() {
  console.log('=== Starting FixMate Comprehensive Backend Test Suite ===');
  await seedDatabase();

  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(TEST_PORT, () => resolve(s));
  });

  try {
    // 1. Auth Testing: Login Admin, Technician, Customer
    console.log('[1/7] Testing Authentication & Role Registration Rules...');
    const adminLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@fixmate.com', password: 'Admin@123456' },
    });
    assert.strictEqual(adminLogin.status, 200, 'Admin login should succeed');
    const adminToken = adminLogin.json.data.token as string;
    assert.strictEqual(adminLogin.json.data.user.role, 'admin');

    const techLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'tech@fixmate.com', password: 'Tech@123456' },
    });
    assert.strictEqual(techLogin.status, 200, 'Technician login should succeed');
    const techToken = techLogin.json.data.token as string;
    assert.strictEqual(techLogin.json.data.user.role, 'technician');

    const custLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'customer@fixmate.com', password: 'Customer@123456' },
    });
    assert.strictEqual(custLogin.status, 200, 'Customer login should succeed');
    const custToken = custLogin.json.data.token as string;
    assert.strictEqual(custLogin.json.data.user.role, 'customer');

    // Attempt registration with role='admin' -> must save as 'customer'
    const escalatedReg = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Attempted Escalation',
        email: 'escalate@fixmate.com',
        password: 'Password123',
        role: 'admin',
      },
    });
    assert.strictEqual(escalatedReg.status, 201);
    assert.strictEqual(
      escalatedReg.json.data.user.role,
      'customer',
      'Public registration with admin role must be forced to customer'
    );

    // Invalid password validation (missing uppercase)
    const badPassReg = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Bad Pass',
        email: 'badpass@fixmate.com',
        password: 'password123',
        role: 'customer',
      },
    });
    assert.strictEqual(badPassReg.status, 400, 'Password without uppercase must fail');

    // 2. Challenge 2: Middleware Authorization (401 & 403)
    console.log('[2/7] Testing Challenge 2: JWT & Role Middlewares (401 / 403)...');
    const unauthReq = await apiRequest('/api/bookings/my');
    assert.strictEqual(unauthReq.status, 401, 'Missing token must return 401');

    const wrongRoleAdmin = await apiRequest('/api/admin/users', {
      token: custToken,
    });
    assert.strictEqual(
      wrongRoleAdmin.status,
      403,
      'Customer accessing /api/admin/users must return 403'
    );

    const wrongRoleTech = await apiRequest('/api/services', {
      method: 'POST',
      token: custToken,
      body: {},
    });
    assert.strictEqual(
      wrongRoleTech.status,
      403,
      'Customer creating a service must return 403'
    );

    // 3. Challenge 1 & 4: Public Services Search, Filter, Sort & Pagination
    console.log('[3/7] Testing Challenge 1 & 4: Search, Filter, Sort & Pagination...');
    const featuredRes = await apiRequest('/api/services/featured');
    assert.strictEqual(featuredRes.status, 200);
    assert.strictEqual(
      featuredRes.json.data.length,
      6,
      'Featured services must return 6 latest approved available services'
    );

    const searchAcRes = await apiRequest(
      '/api/services?category=AC&sort=price_asc&page=1&limit=5'
    );
    assert.strictEqual(searchAcRes.status, 200);
    assert.ok(searchAcRes.json.data.length >= 2);
    assert.ok(
      searchAcRes.json.data.every((s: any) => s.category === 'AC'),
      'Category filter must only return AC services'
    );
    assert.ok(
      searchAcRes.json.data[0].basePrice <= searchAcRes.json.data[1].basePrice,
      'price_asc sort must order by basePrice ascending'
    );

    // 4. Technician Service Lifecycle & Admin Moderation
    console.log('[4/7] Testing Service Creation, Edit Re-Approval & Admin Moderation...');
    const newSvcRes = await apiRequest('/api/services', {
      method: 'POST',
      token: techToken,
      body: {
        title: 'MacBook Air M3 Liquid Spill Recovery',
        category: 'Laptop & PC',
        description:
          'Complete board-level corrosion removal and ultrasonic cleaning for liquid-damaged MacBooks.',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
        basePrice: 120,
        estimatedDuration: '1-2 days',
        serviceMode: 'Shop Drop-off',
        serviceArea: 'Dhanmondi, Dhaka',
      },
    });
    assert.strictEqual(newSvcRes.status, 201);
    const createdSvcId = newSvcRes.json.data._id as string;
    assert.strictEqual(
      newSvcRes.json.data.approvalStatus,
      'pending',
      'New service must default to pending'
    );

    // Unapproved service must return 404 on public details route
    const unapprovedPublic = await apiRequest(`/api/services/${createdSvcId}`);
    assert.strictEqual(
      unapprovedPublic.status,
      404,
      'Pending service must not be accessible on public details page'
    );

    // Admin approves service
    const approveRes = await apiRequest(
      `/api/admin/services/${createdSvcId}/approval`,
      {
        method: 'PATCH',
        token: adminToken,
        body: { approvalStatus: 'approved' },
      }
    );
    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.json.data.approvalStatus, 'approved');

    // Technician edits service -> must return to pending
    const editRes = await apiRequest(`/api/services/${createdSvcId}`, {
      method: 'PATCH',
      token: techToken,
      body: { basePrice: 125 },
    });
    assert.strictEqual(editRes.status, 200);
    assert.strictEqual(
      editRes.json.data.approvalStatus,
      'pending',
      'Edited service must reset approvalStatus to pending'
    );

    // Re-approve for booking test
    await apiRequest(`/api/admin/services/${createdSvcId}/approval`, {
      method: 'PATCH',
      token: adminToken,
      body: { approvalStatus: 'approved' },
    });

    // 5. Booking Creation, Duplicate Prevention & Strict Status Pipeline (Challenge 3)
    console.log('[5/7] Testing Challenge 3: Booking Rules & Status Pipeline...');
    // Technician cannot book a service
    const techBookAttempt = await apiRequest('/api/bookings', {
      method: 'POST',
      token: techToken,
      body: {
        serviceId: createdSvcId,
        customerPhone: '+8801700000000',
        address: 'Dhanmondi',
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        problemDescription: 'Attempting to book as a technician account.',
      },
    });
    assert.strictEqual(
      techBookAttempt.status,
      403,
      'Technicians must be blocked from creating bookings'
    );

    // Customer creates booking
    const createBookingRes = await apiRequest('/api/bookings', {
      method: 'POST',
      token: custToken,
      body: {
        serviceId: createdSvcId,
        customerPhone: '+880 1677-889900',
        address: 'Mirpur-10, Dhaka',
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        problemDescription:
          'Coffee spilled on MacBook keyboard yesterday and trackpad stopped clicking.',
      },
    });
    assert.strictEqual(createBookingRes.status, 201);
    const bookingId = createBookingRes.json.data._id as string;

    // Duplicate active request for same service must fail with 409
    const dupBookingRes = await apiRequest('/api/bookings', {
      method: 'POST',
      token: custToken,
      body: {
        serviceId: createdSvcId,
        customerPhone: '+880 1677-889900',
        address: 'Mirpur-10, Dhaka',
        preferredDate: new Date(Date.now() + 86400000).toISOString(),
        problemDescription:
          'Second duplicate active request for the exact same service.',
      },
    });
    assert.strictEqual(
      dupBookingRes.status,
      409,
      'Duplicate active booking for same service must be rejected with 409'
    );

    // Invalid jump: requested -> completed must be rejected (400)
    const invalidJumpRes = await apiRequest(
      `/api/bookings/${bookingId}/status`,
      {
        method: 'PATCH',
        token: techToken,
        body: { status: 'completed', finalAmount: 130 },
      }
    );
    assert.strictEqual(
      invalidJumpRes.status,
      400,
      'Skipping from requested to completed must be rejected'
    );

    // Payment before completion must be rejected (400)
    const earlyPayRes = await apiRequest(
      '/api/payments/create-checkout-session',
      {
        method: 'POST',
        token: custToken,
        body: { bookingId },
      }
    );
    assert.strictEqual(
      earlyPayRes.status,
      400,
      'Payment before completion must be rejected'
    );

    // Valid pipeline: requested -> accepted -> in-progress -> completed
    const acceptRes = await apiRequest(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      token: techToken,
      body: { status: 'accepted' },
    });
    assert.strictEqual(acceptRes.status, 200);

    // Customer cannot cancel after job is accepted
    const lateCancelRes = await apiRequest(
      `/api/bookings/${bookingId}/cancel`,
      {
        method: 'PATCH',
        token: custToken,
      }
    );
    assert.strictEqual(
      lateCancelRes.status,
      400,
      'Customer must not be able to cancel an accepted job'
    );

    const startRes = await apiRequest(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      token: techToken,
      body: { status: 'in-progress' },
    });
    assert.strictEqual(startRes.status, 200);

    const completeRes = await apiRequest(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      token: techToken,
      body: { status: 'completed', finalAmount: 140 },
    });
    assert.strictEqual(completeRes.status, 200);
    assert.strictEqual(completeRes.json.data.finalAmount, 140);

    // 6. Payment Checkout, Verification & Idempotency (Challenge 3 & 4)
    console.log('[6/7] Testing Stripe Checkout, Verification & Idempotency...');
    const checkoutRes = await apiRequest(
      '/api/payments/create-checkout-session',
      {
        method: 'POST',
        token: custToken,
        body: { bookingId },
      }
    );
    assert.strictEqual(checkoutRes.status, 200);
    const sessionId = checkoutRes.json.data.sessionId as string;

    const verify1 = await apiRequest(
      `/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`,
      {
        token: custToken,
      }
    );
    assert.strictEqual(verify1.status, 200);
    assert.strictEqual(verify1.json.data.alreadyProcessed, false);

    // Second verification call (simulating webhook + success page reload) must be idempotent
    const verify2 = await apiRequest(
      `/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`,
      {
        token: custToken,
      }
    );
    assert.strictEqual(verify2.status, 200);
    assert.strictEqual(
      verify2.json.data.alreadyProcessed,
      true,
      'Duplicate payment verification must be idempotent and not create a second record'
    );

    // Webhook signature verification: invalid signature must be rejected with 400
    const badWebhookRes = await apiRequest('/api/payments/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 't=12345,v1=invalidsignature' },
      body: { type: 'checkout.session.completed' },
    });
    assert.strictEqual(
      badWebhookRes.status,
      400,
      'Webhook with invalid Stripe signature must be rejected with 400'
    );

    // Invoice endpoint verification
    const invoiceRes = await apiRequest(`/api/payments/${bookingId}/invoice`, {
      token: custToken,
    });
    assert.strictEqual(
      invoiceRes.status,
      200,
      'Customer should be able to retrieve invoice for paid booking'
    );

    // 7. Admin Self-Demotion Protection & Revenue Verification
    console.log('[7/7] Testing Admin Self-Role Protection & Revenue Calculation...');
    const adminSelfRole = await apiRequest(
      `/api/admin/users/${adminLogin.json.data.user._id}/role`,
      {
        method: 'PATCH',
        token: adminToken,
        body: { role: 'customer' },
      }
    );
    assert.strictEqual(
      adminSelfRole.status,
      403,
      'Admin must not be allowed to change their own role'
    );

    const adminTxRes = await apiRequest('/api/admin/payments', {
      token: adminToken,
    });
    assert.strictEqual(adminTxRes.status, 200);
    assert.strictEqual(
      adminTxRes.json.data.totalCount,
      4,
      'Total payments should be 3 seeded + 1 newly verified = 4'
    );
    assert.strictEqual(
      adminTxRes.json.data.totalRevenue,
      357,
      'Total revenue should be 217 + 140 = 357'
    );

    // Re-seed clean state after tests
    await seedDatabase();
    console.log('=== ALL 7 BACKEND TEST SUITES PASSED SUCCESSFULLY! ===');
  } finally {
    server.close();
    await closeDB();
  }
}

runTests().catch((err) => {
  console.error('[Test Suite Failed]:', err);
  process.exit(1);
});
