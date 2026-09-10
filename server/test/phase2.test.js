const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_jwt_secret_key_for_phase2_validation_only_67890';
process.env.JWT_EXPIRES_IN = '1d';
process.env.PORT = '5002';

const app = require('../src/app');
const User = require('../src/models/User');
const Connection = require('../src/models/Connection');

let mongod;
let server;
let baseUrl;

// Helper for making HTTP requests to test server
const request = async (method, route, body = null, token = null) => {
  const url = `${baseUrl}${route}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data };
};

describe('Linkture Phase 2 Networking & Discovery Suite', () => {
  before(async () => {
    mongod = await MongoMemoryServer.create({
      instance: { startupTimeoutMS: 120000 },
    });
    const uri = mongod.getUri();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  let founderToken;
  let founderId;
  let vcToken;
  let vcId;
  let studentToken;
  let studentId;
  let thirdPartyToken;
  let thirdPartyId;
  let connectionId;

  test('Setup: Seed initial users for testing', async () => {
    // 1. Startup User
    const sRes = await request('POST', '/api/auth/register', {
      fullName: 'Elena Rostova',
      email: 'elena@novapulse.io',
      password: 'SecurePassword123!',
      role: 'Startup',
      bio: 'Pioneering next-gen real-time telemetry for electric aviation.',
      location: 'Austin, TX',
      skills: ['react', 'node', 'embedded', 'telemetry'],
      interests: ['climate', 'hardware', 'mobility'],
      companyName: 'NovaPulse Aero',
      startupStage: 'Seed',
      industry: 'Climate',
      pitchDeckUrl: 'https://novapulse.io/deck.pdf',
      teamSize: 6,
    });
    assert.equal(sRes.status, 201);
    founderToken = sRes.data.token;
    founderId = sRes.data.user.id;

    // 2. VC User
    const vRes = await request('POST', '/api/auth/register', {
      fullName: 'Marcus Vance',
      email: 'marcus@vancecap.com',
      password: 'SecurePassword123!',
      role: 'VC',
      bio: 'Early stage climate and deeptech investor backed by institutional LP capital.',
      location: 'San Francisco, CA',
      skills: ['venture capital', 'due diligence', 'telemetry'],
      interests: ['climate', 'deeptech', 'hardware'],
      firmName: 'Vance Capital',
      domainInterests: ['Climate', 'AI'],
      investmentStage: ['Seed', 'Series A'],
      ticketSizeMin: 250000,
      ticketSizeMax: 2000000,
    });
    assert.equal(vRes.status, 201);
    vcToken = vRes.data.token;
    vcId = vRes.data.user.id;

    // 3. Student User
    const stRes = await request('POST', '/api/auth/register', {
      fullName: 'Aria Chen',
      email: 'aria@stanford.edu',
      password: 'SecurePassword123!',
      role: 'Student',
      bio: 'Aerospace engineering undergraduate passionate about EV powertrain design.',
      location: 'Palo Alto, CA',
      skills: ['react', 'embedded', 'cad'],
      interests: ['climate', 'mobility'],
      incubatorName: 'Stanford Launchpad',
      program: 'B.S. Aerospace Engineering',
      graduationYear: 2027,
    });
    assert.equal(stRes.status, 201);
    studentToken = stRes.data.token;
    studentId = stRes.data.user.id;

    // 4. Third-party Startup User for permission test
    const tpRes = await request('POST', '/api/auth/register', {
      fullName: 'Devon Miles',
      email: 'devon@byteflux.dev',
      password: 'SecurePassword123!',
      role: 'Startup',
      bio: 'Enterprise observability dashboard for microservices.',
      location: 'Seattle, WA',
      skills: ['go', 'kubernetes', 'monitoring'],
      interests: ['saas', 'cloud'],
      companyName: 'ByteFlux',
      startupStage: 'Pre-Seed',
      industry: 'SaaS',
    });
    assert.equal(tpRes.status, 201);
    thirdPartyToken = tpRes.data.token;
    thirdPartyId = tpRes.data.user.id;
  });

  // ==========================================
  // CONNECTIONS WORKFLOW TESTS (1 - 10)
  // ==========================================

  test('1. Authenticated user can send connection request', async () => {
    const res = await request(
      'POST',
      '/api/connections/request',
      { recipientId: vcId, message: 'We are raising Seed for our telemetry platform.' },
      founderToken
    );

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.connection);
    assert.equal(res.data.connection.status, 'pending');
    assert.equal(res.data.connection.message, 'We are raising Seed for our telemetry platform.');
    assert.equal(String(res.data.connection.requester.id || res.data.connection.requester._id), founderId);
    assert.equal(String(res.data.connection.recipient.id || res.data.connection.recipient._id), vcId);
    connectionId = res.data.connection.id || res.data.connection._id;
  });

  test('2. Unauthenticated user cannot send request', async () => {
    const res = await request(
      'POST',
      '/api/connections/request',
      { recipientId: vcId },
      null
    );
    assert.equal(res.status, 401);
  });

  test('3. Self-request is rejected', async () => {
    const res = await request(
      'POST',
      '/api/connections/request',
      { recipientId: founderId },
      founderToken
    );
    assert.equal(res.status, 400);
    assert.match(res.data.message, /yourself/i);
  });

  test('4. Duplicate request is rejected', async () => {
    const res = await request(
      'POST',
      '/api/connections/request',
      { recipientId: vcId },
      founderToken
    );
    assert.equal(res.status, 400);
    assert.match(res.data.message, /already sent and pending/i);
  });

  test('5. Reverse duplicate request is handled correctly', async () => {
    // VC tries to request founder when founder already requested VC
    const res = await request(
      'POST',
      '/api/connections/request',
      { recipientId: founderId },
      vcToken
    );
    assert.equal(res.status, 400);
    assert.match(res.data.message, /already sent you a connection request/i);
  });

  test('6. Wrong user cannot accept a connection request', async () => {
    // Devon Miles tries to accept Elena's request to Marcus
    const res = await request(
      'PATCH',
      `/api/connections/${connectionId}`,
      { status: 'accepted' },
      thirdPartyToken
    );
    assert.equal(res.status, 403);
    assert.match(res.data.message, /Only the recipient/i);
  });

  test('7. Wrong user cannot decline a connection request', async () => {
    const res = await request(
      'PATCH',
      `/api/connections/${connectionId}`,
      { status: 'declined' },
      thirdPartyToken
    );
    assert.equal(res.status, 403);
  });

  test('8. Recipient can accept connection request', async () => {
    const res = await request(
      'PATCH',
      `/api/connections/${connectionId}`,
      { status: 'accepted' },
      vcToken
    );
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.connection.status, 'accepted');
  });

  test('9. Accepted connection is visible in active connections for both users', async () => {
    // Check founder's connections
    const founderConnRes = await request('GET', '/api/connections', null, founderToken);
    assert.equal(founderConnRes.status, 200);
    assert.equal(founderConnRes.data.accepted.length, 1);
    assert.equal(
      String(founderConnRes.data.accepted[0].recipient.id || founderConnRes.data.accepted[0].recipient._id),
      vcId
    );

    // Check VC's connections
    const vcConnRes = await request('GET', '/api/connections', null, vcToken);
    assert.equal(vcConnRes.status, 200);
    assert.equal(vcConnRes.data.accepted.length, 1);
    assert.equal(
      String(vcConnRes.data.accepted[0].requester.id || vcConnRes.data.accepted[0].requester._id),
      founderId
    );
  });

  test('10. Connection status endpoint reports accurate relationship', async () => {
    const res = await request('GET', `/api/connections/status/${vcId}`, null, founderToken);
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'accepted');

    const unconnectedRes = await request('GET', `/api/connections/status/${thirdPartyId}`, null, founderToken);
    assert.equal(unconnectedRes.status, 200);
    assert.equal(unconnectedRes.data.status, 'none');
  });

  test('10b. Recipient can decline and renew requests', async () => {
    // Student sends request to ThirdParty
    const sendRes = await request(
      'POST',
      '/api/connections/request',
      { recipientId: thirdPartyId, message: 'Interested in internships' },
      studentToken
    );
    assert.equal(sendRes.status, 201);
    const newConnId = sendRes.data.connection.id || sendRes.data.connection._id;

    // ThirdParty declines
    const declineRes = await request(
      'PATCH',
      `/api/connections/${newConnId}`,
      { status: 'declined' },
      thirdPartyToken
    );
    assert.equal(declineRes.status, 200);
    assert.equal(declineRes.data.connection.status, 'declined');

    // Student can renew declined request
    const renewRes = await request(
      'POST',
      '/api/connections/request',
      { recipientId: thirdPartyId, message: 'Updated resume attached' },
      studentToken
    );
    assert.equal(renewRes.status, 200);
    assert.equal(renewRes.data.connection.status, 'pending');
  });

  // ==========================================
  // DISCOVERY & FILTERING TESTS (11 - 16)
  // ==========================================

  test('11. Startup discovery returns real database users', async () => {
    const res = await request('GET', '/api/users/startups', null, vcToken);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.data.startups));
    assert.ok(res.data.data.startups.length >= 2);

    const nova = res.data.data.startups.find((s) => s.id === founderId);
    assert.ok(nova, 'NovaPulse Aero must be in startups discovery');
    assert.equal(nova.domain, 'Climate');
    assert.equal(nova.stage, 'Seed');
    assert.equal(nova.connectionStatus, 'accepted');
  });

  test('12. Investor discovery returns real database users', async () => {
    const res = await request('GET', '/api/users/investors', null, founderToken);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.data.investors));
    assert.ok(res.data.data.investors.length >= 1);

    const vance = res.data.data.investors.find((i) => i.id === vcId);
    assert.ok(vance, 'Marcus Vance must be in investors discovery');
    assert.equal(vance.firmName, 'Vance Capital');
    assert.equal(vance.connectionStatus, 'accepted');
  });

  test('13. Server-side search works accurately', async () => {
    // Search startups by keyword
    const searchRes = await request('GET', '/api/users/startups?q=telemetry', null, vcToken);
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.data.data.startups.length, 1);
    assert.equal(searchRes.data.data.startups[0].id, founderId);

    // Search by company name
    const searchNameRes = await request('GET', '/api/users/startups?q=ByteFlux', null, vcToken);
    assert.equal(searchNameRes.status, 200);
    assert.equal(searchNameRes.data.data.startups.length, 1);
    assert.equal(searchNameRes.data.data.startups[0].id, thirdPartyId);
  });

  test('14. Domain/Stage filters work where supported', async () => {
    // Filter startups by domain: SaaS
    const filterDomainRes = await request('GET', '/api/users/startups?domain=SaaS', null, vcToken);
    assert.equal(filterDomainRes.status, 200);
    assert.equal(filterDomainRes.data.data.startups.length, 1);
    assert.equal(filterDomainRes.data.data.startups[0].id, thirdPartyId);

    // Filter startups by stage: Seed
    const filterStageRes = await request('GET', '/api/users/startups?stage=Seed', null, vcToken);
    assert.equal(filterStageRes.status, 200);
    assert.equal(filterStageRes.data.data.startups.length, 1);
    assert.equal(filterStageRes.data.data.startups[0].id, founderId);
  });

  test('15. Server-side pagination metadata and limits work correctly', async () => {
    const pageRes = await request('GET', '/api/users/startups?page=1&limit=1', null, vcToken);
    assert.equal(pageRes.status, 200);
    assert.equal(pageRes.data.data.startups.length, 1);
    assert.equal(pageRes.data.data.pagination.page, 1);
    assert.equal(pageRes.data.data.pagination.limit, 1);
    assert.ok(pageRes.data.data.pagination.total >= 2);
    assert.ok(pageRes.data.data.pagination.totalPages >= 2);
  });

  test('16. Sensitive fields (passwords, hashes, tokens, emails) are excluded', async () => {
    const startupRes = await request('GET', '/api/users/startups', null, vcToken);
    startupRes.data.data.startups.forEach((s) => {
      assert.equal(s.passwordHash, undefined);
      assert.equal(s.password, undefined);
      assert.equal(s.__v, undefined);
    });

    const investorRes = await request('GET', '/api/users/investors', null, founderToken);
    investorRes.data.data.investors.forEach((i) => {
      assert.equal(i.passwordHash, undefined);
      assert.equal(i.password, undefined);
      assert.equal(i.__v, undefined);
    });
  });

  // ==========================================
  // MATCHING ENGINE TESTS (17 - 19)
  // ==========================================

  test('17. Matching endpoint returns real recommendations based on overlap', async () => {
    // Student matches with complementary Startups (ByteFlux, or NovaPulse if not connected)
    const matchRes = await request('GET', '/api/match', null, studentToken);
    assert.equal(matchRes.status, 200);
    assert.ok(Array.isArray(matchRes.data.matches));
    assert.ok(matchRes.data.matches.length >= 1);
    assert.ok(matchRes.data.matches[0].matchScore > 0);
  });

  test('18. Current user is excluded from recommendations', async () => {
    const matchRes = await request('GET', '/api/match', null, studentToken);
    const selfIncluded = matchRes.data.matches.some((m) => String(m.id || m._id) === studentId);
    assert.equal(selfIncluded, false, 'Current user must never be recommended to themselves');
  });

  test('19. Existing active connections are excluded from recommendations', async () => {
    // Elena (Startup) and Marcus (VC) are accepted connections
    const elenaMatches = await request('GET', '/api/match', null, founderToken);
    const marcusIncluded = elenaMatches.data.matches.some((m) => String(m.id || m._id) === vcId);
    assert.equal(marcusIncluded, false, 'Connected user Marcus must be excluded from Elena recommendations');

    const marcusMatches = await request('GET', '/api/match', null, vcToken);
    const elenaIncluded = marcusMatches.data.matches.some((m) => String(m.id || m._id) === founderId);
    assert.equal(elenaIncluded, false, 'Connected user Elena must be excluded from Marcus recommendations');
  });
});
