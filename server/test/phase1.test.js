const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_jwt_secret_key_for_phase1_validation_only_12345';
process.env.JWT_EXPIRES_IN = '1d';
process.env.PORT = '5001';

const app = require('../src/app');
const User = require('../src/models/User');

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

describe('Linkture Phase 1 Validation Suite', () => {
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

  test('1. Package manifests are valid JSON and dependencies are clean', () => {
    const clientPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../client/package.json'), 'utf-8'));
    const serverPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));

    assert.ok(clientPkg.name === 'linkture-client');
    assert.ok(!clientPkg.dependencies['mongodb-memory-server'], 'client should not have mongodb-memory-server');

    assert.ok(serverPkg.name === 'linkture-server');
    assert.ok(serverPkg.devDependencies['mongodb-memory-server'], 'server should have mongodb-memory-server in devDependencies');
  });

  test('2. Dead code RoleDashboard.jsx has been removed', () => {
    const roleDashboardPath = path.resolve(__dirname, '../../client/src/pages/dashboard/RoleDashboard.jsx');
    assert.ok(!fs.existsSync(roleDashboardPath), 'RoleDashboard.jsx should not exist');
  });

  let startupToken;
  let startupUserId;
  let vcToken;
  let vcUserId;

  test('3. User registration works and does not return password hashes', async () => {
    // Register Startup
    const startupRes = await request('POST', '/api/auth/register', {
      fullName: 'Founder Alpha',
      email: 'founder@alphastartup.io',
      password: 'SecurePassword123!',
      role: 'Startup',
      bio: 'Building the future of AI workflows.',
      location: 'San Francisco, CA',
      companyName: 'AlphaAI',
      startupStage: 'Seed',
      industry: 'AI',
      pitchDeckUrl: 'https://alphastartup.io/deck.pdf',
      teamSize: 5,
    });

    assert.equal(startupRes.status, 201);
    assert.ok(startupRes.data.token, 'Token must be issued');
    assert.equal(startupRes.data.user.role, 'Startup');
    assert.equal(startupRes.data.user.passwordHash, undefined, 'Password hash must never be returned');
    startupToken = startupRes.data.token;
    startupUserId = startupRes.data.user.id;

    // Register VC
    const vcRes = await request('POST', '/api/auth/register', {
      fullName: 'Partner Beta',
      email: 'partner@betavc.com',
      password: 'SecurePassword123!',
      role: 'VC',
      firmName: 'Beta Ventures',
      domainInterests: ['AI', 'SaaS'],
    });

    assert.equal(vcRes.status, 201);
    assert.ok(vcRes.data.token);
    assert.equal(vcRes.data.user.role, 'VC');
    assert.equal(vcRes.data.user.passwordHash, undefined);
    vcToken = vcRes.data.token;
    vcUserId = vcRes.data.user.id;
  });

  test('4. Authentication enforcement and role isolation on login', async () => {
    // Correct login
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'founder@alphastartup.io',
      password: 'SecurePassword123!',
      role: 'Startup',
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.data.token);

    // Wrong password
    const wrongPassRes = await request('POST', '/api/auth/login', {
      email: 'founder@alphastartup.io',
      password: 'WrongPassword!',
      role: 'Startup',
    });
    assert.equal(wrongPassRes.status, 401);

    // Wrong role portal
    const wrongRoleRes = await request('POST', '/api/auth/login', {
      email: 'founder@alphastartup.io',
      password: 'SecurePassword123!',
      role: 'VC',
    });
    assert.equal(wrongRoleRes.status, 403);
  });

  test('5. Profile validation allows legitimate partial updates', async () => {
    // Valid partial update: only bio and location
    const updateRes = await request(
      'PUT',
      '/api/profile',
      {
        bio: 'Updated AI workflow automation platform description.',
        location: 'New York, NY',
      },
      startupToken
    );

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.user.bio, 'Updated AI workflow automation platform description.');
    assert.equal(updateRes.data.user.location, 'New York, NY');
  });

  test('6. Profile validation rejects invalid data', async () => {
    // Invalid avatarUrl (not a URI)
    const invalidRes = await request(
      'PUT',
      '/api/profile',
      {
        avatarUrl: 'not-a-valid-url-format',
      },
      startupToken
    );

    assert.equal(invalidRes.status, 400);
    assert.equal(invalidRes.data.success, false);
  });

  test('7. Unauthorized cross-user profile update is blocked', async () => {
    // Founder tries to pass another user's ID
    const hackRes = await request(
      'PUT',
      '/api/profile',
      {
        id: vcUserId,
        bio: 'Hacked bio',
      },
      startupToken
    );

    assert.equal(hackRes.status, 403);
  });

  test('8. VC Dashboard returns real MongoDB startups in the feed', async () => {
    const vcDashRes = await request('GET', '/api/users/vc/dashboard', null, vcToken);

    assert.equal(vcDashRes.status, 200);
    assert.ok(Array.isArray(vcDashRes.data.data.startupFeed));

    // Verify real startup created in DB is present
    const matchedStartup = vcDashRes.data.data.startupFeed.find(
      (s) => s.id === startupUserId || s.name === 'AlphaAI' || s.name === 'Founder Alpha'
    );

    assert.ok(matchedStartup, 'Registered startup from MongoDB must be present in VC feed');
    assert.equal(matchedStartup.domain, 'AI');
    assert.equal(matchedStartup.stage, 'Seed');
    assert.ok(matchedStartup.matchScore >= 50 && matchedStartup.matchScore <= 100);
    assert.equal(matchedStartup.passwordHash, undefined, 'No password hash in feed');
  });

  test('9. Role-based route guard blocks non-VC from VC dashboard endpoint', async () => {
    const blockedRes = await request('GET', '/api/users/vc/dashboard', null, startupToken);
    assert.equal(blockedRes.status, 403);
  });

  test('10. Unauthenticated requests to protected endpoints are rejected with 401', async () => {
    const unauthRes = await request('GET', '/api/auth/me', null, null);
    assert.equal(unauthRes.status, 401);
  });
});
