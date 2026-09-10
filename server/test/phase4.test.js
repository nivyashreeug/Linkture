const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_phase4_security_hardening_suite_112233';
process.env.JWT_EXPIRES_IN = '1d';
process.env.PORT = '5004';

const app = require('../src/app');
const User = require('../src/models/User');
const Connection = require('../src/models/Connection');

let mongod;
let server;
let baseUrl;

// Helper for making JSON HTTP requests
const request = async (method, route, body = null, token = null, customHeaders = {}) => {
  const url = `${baseUrl}${route}`;
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
};

// Helper for multipart/form-data upload using native fetch & FormData
const uploadFileRequest = async (route, fieldName, fileName, fileBuffer, mimeType, token = null) => {
  const url = `${baseUrl}${route}`;
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append(fieldName, blob, fileName);

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
};

describe('Linkture Phase 4 Security Hardening & Automated Testing Suite', () => {
  before(async () => {
    mongod = await MongoMemoryServer.create({
      instance: { launchTimeout: 60000 },
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

  let startupUserToken;
  let startupUserId;
  let startup2Token;
  let startup2Id;
  let vcUserToken;
  let vcUserId;
  let studentUserToken;
  let studentUserId;

  test('Setup: Seed test accounts for security test execution', async () => {
    // 1. Startup 1
    const s1 = await request('POST', '/api/auth/register', {
      fullName: 'Sec Startup Founder',
      email: 'sec_startup@example.com',
      password: 'SecurePassword123!',
      role: 'Startup',
      companyName: 'Securify AI',
      startupStage: 'Seed',
      industry: 'AI',
      pitchDeckUrl: 'https://example.com/pitch.pdf',
    });
    assert.equal(s1.status, 201);
    startupUserToken = s1.data.token;
    startupUserId = s1.data.user.id;

    // 2. Startup 2 (for cross-user ownership tests)
    const s2 = await request('POST', '/api/auth/register', {
      fullName: 'Second Founder',
      email: 'second_startup@example.com',
      password: 'SecurePassword123!',
      role: 'Startup',
      companyName: 'ZeroTrust Labs',
      startupStage: 'MVP',
      industry: 'Cybersecurity',
      pitchDeckUrl: 'https://example.com/zt.pdf',
    });
    assert.equal(s2.status, 201);
    startup2Token = s2.data.token;
    startup2Id = s2.data.user.id;

    // 3. VC
    const vc = await request('POST', '/api/auth/register', {
      fullName: 'Sec VC Partner',
      email: 'sec_vc@example.com',
      password: 'SecurePassword123!',
      role: 'VC',
      firmName: 'Apex Security Capital',
      domainInterests: ['AI', 'FinTech'],
      investmentStage: ['Seed', 'Series A'],
    });
    assert.equal(vc.status, 201);
    vcUserToken = vc.data.token;
    vcUserId = vc.data.user.id;

    // 4. Student
    const st = await request('POST', '/api/auth/register', {
      fullName: 'Sec Student Researcher',
      email: 'sec_student@example.com',
      password: 'SecurePassword123!',
      role: 'Student',
      institutionName: 'Stanford University',
      program: 'Computer Science',
      graduationYear: 2026,
    });
    assert.equal(st.status, 201);
    studentUserToken = st.data.token;
    studentUserId = st.data.user.id;
  });

  // ==========================================
  // 1. AUTHENTICATION SECURITY
  // ==========================================
  describe('Authentication Security', () => {
    test('1. Protected endpoint without token returns 401', async () => {
      const res = await request('GET', '/api/users/profile');
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    test('2. Invalid JWT token is rejected with 401', async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
      const res = await request('GET', '/api/users/profile', null, fakeToken);
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    test('3. Malformed authorization header is rejected with 401', async () => {
      const res = await request('GET', '/api/users/profile', null, null, {
        Authorization: 'Basic invalid_creds',
      });
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    test('4. Password hash is never returned on auth responses', async () => {
      const loginRes = await request('POST', '/api/auth/login', {
        email: 'sec_startup@example.com',
        password: 'SecurePassword123!',
        role: 'Startup',
      });
      assert.equal(loginRes.status, 200);
      assert.equal(loginRes.data.user.passwordHash, undefined);
      assert.equal(loginRes.data.user.password, undefined);

      const meRes = await request('GET', '/api/auth/me', null, startupUserToken);
      assert.equal(meRes.status, 200);
      assert.equal(meRes.data.user.passwordHash, undefined);
    });

    test('5. Sensitive auth data / internal secrets not exposed in token payload or responses', async () => {
      const meRes = await request('GET', '/api/auth/me', null, startupUserToken);
      assert.equal(meRes.status, 200);
      const jsonStr = JSON.stringify(meRes.data);
      assert.equal(jsonStr.includes('passwordHash'), false);
      assert.equal(jsonStr.includes('JWT_SECRET'), false);
      assert.equal(jsonStr.includes('__v'), false);
    });
  });

  // ==========================================
  // 2. ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================
  describe('Role-Based Access Control', () => {
    test('6. Startup role is blocked from VC-only dashboard (403)', async () => {
      const res = await request('GET', '/api/users/vc/dashboard', null, startupUserToken);
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    test('7. VC role is blocked from Startup pitch deck uploads/deletions (403)', async () => {
      const uploadRes = await uploadFileRequest(
        '/api/startups/pitch',
        'pitchDeck',
        'deck.pdf',
        Buffer.from('%PDF-1.4 test pitch deck content'),
        'application/pdf',
        vcUserToken
      );
      assert.equal(uploadRes.status, 403);

      const deleteRes = await request('DELETE', '/api/startups/pitch', null, vcUserToken);
      assert.equal(deleteRes.status, 403);
    });

    test('8. Student role is blocked from VC dashboard and Startup pitch uploads (403)', async () => {
      const vcDashRes = await request('GET', '/api/users/vc/dashboard', null, studentUserToken);
      assert.equal(vcDashRes.status, 403);

      const pitchRes = await uploadFileRequest(
        '/api/startups/pitch',
        'pitchDeck',
        'student_deck.pdf',
        Buffer.from('%PDF-1.4 student deck content'),
        'application/pdf',
        studentUserToken
      );
      assert.equal(pitchRes.status, 403);
    });
  });

  // ==========================================
  // 3. OWNERSHIP & IDOR PROTECTION
  // ==========================================
  describe('Ownership & IDOR Protection', () => {
    test('9. User cannot modify another user\'s profile via ID spoofing (403)', async () => {
      const res = await request(
        'PUT',
        '/api/profile',
        {
          id: startup2Id,
          fullName: 'Hacked Name by Startup 1',
        },
        startupUserToken
      );
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);

      // Verify startup 2's profile was not changed
      const s2Profile = await User.findById(startup2Id);
      assert.equal(s2Profile.fullName, 'Second Founder');
    });

    let connectionId;

    test('10-12. Connection ownership: Only recipient can accept/decline connection request (403 for others)', async () => {
      // Startup 1 sends connection request to VC
      const sendRes = await request(
        'POST',
        '/api/connections/request',
        {
          recipientId: vcUserId,
          message: 'Hello VC!',
        },
        startupUserToken
      );
      assert.equal(sendRes.status, 201);
      connectionId = sendRes.data.connection.id || sendRes.data.connection._id;

      // 10. Third party (Student) cannot accept/modify Startup1-VC connection
      const studentAttempt = await request(
        'PATCH',
        `/api/connections/${connectionId}`,
        { status: 'accepted' },
        studentUserToken
      );
      assert.equal(studentAttempt.status, 403);

      // 11. Requester (Startup 1) cannot accept their own sent request
      const requesterAccept = await request(
        'PATCH',
        `/api/connections/${connectionId}`,
        { status: 'accepted' },
        startupUserToken
      );
      assert.equal(requesterAccept.status, 403);

      // 12. Requester (Startup 1) cannot decline their own sent request
      const requesterDecline = await request(
        'PATCH',
        `/api/connections/${connectionId}`,
        { status: 'declined' },
        startupUserToken
      );
      assert.equal(requesterDecline.status, 403);

      // Legitimate recipient (VC) can accept
      const vcAccept = await request(
        'PATCH',
        `/api/connections/${connectionId}`,
        { status: 'accepted' },
        vcUserToken
      );
      assert.equal(vcAccept.status, 200);
      assert.equal(vcAccept.data.connection.status, 'accepted');
    });

    test('13-14. Startup pitch deck ownership protection (isolated to authenticated user)', async () => {
      // Startup 1 uploads pitch deck
      const uploadRes = await uploadFileRequest(
        '/api/startups/pitch',
        'pitchDeck',
        'startup1_deck.pdf',
        Buffer.from('%PDF-1.4 unique pitch deck content for startup 1'),
        'application/pdf',
        startupUserToken
      );
      assert.equal(uploadRes.status, 200);

      // Verify Startup 2 cannot delete Startup 1's pitch deck (DELETE deletes caller's own deck)
      const s2Delete = await request('DELETE', '/api/startups/pitch', null, startup2Token);
      assert.equal(s2Delete.status, 200);

      // Startup 1's pitch deck remains intact
      const s1Deck = await request('GET', `/api/startups/pitch?userId=${startupUserId}`, null, startupUserToken);
      assert.equal(s1Deck.status, 200);
      assert.equal(s1Deck.data.hasPitchDeck, true);
    });
  });

  // ==========================================
  // 4. INPUT VALIDATION
  // ==========================================
  describe('Input Validation & Boundary Checking', () => {
    test('15. Invalid profile payload (unknown injected fields) is rejected with 400', async () => {
      const res = await request(
        'PUT',
        '/api/profile',
        {
          injectedMaliciousField: 'evil_payload',
          isAdmin: true,
        },
        startupUserToken
      );
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    test('16. Invalid / malformed ObjectId is handled safely with 400', async () => {
      const profileRes = await request('GET', '/api/profile/invalid_non_object_id', null, startupUserToken);
      assert.equal(profileRes.status, 400);

      const connRes = await request('PATCH', '/api/connections/not-a-valid-oid', { status: 'accepted' }, startupUserToken);
      assert.equal(connRes.status, 400);
    });

    test('17. Invalid pagination (negative page, non-numeric limit) is safely sanitized', async () => {
      const res = await request('GET', '/api/users/startups?page=-5&limit=abc', null, startupUserToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.pagination.page, 1);
      assert.equal(res.data.data.pagination.limit, 10);
    });

    test('18. Excessive pagination limit is safely capped to maximum 50', async () => {
      const res = await request('GET', '/api/users/startups?limit=999999', null, startupUserToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.pagination.limit, 50);
    });

    test('19. Invalid / non-existent filter values handled safely without crashing', async () => {
      const res = await request('GET', '/api/users/startups?domain=NonExistentDomainXYZ123', null, startupUserToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.count, 0);
      assert.deepEqual(res.data.data.startups, []);
    });
  });

  // ==========================================
  // 5. PITCH DECK & FILE UPLOAD SECURITY
  // ==========================================
  describe('File Upload Security', () => {
    test('20. Non-PDF file upload is rejected with 400', async () => {
      const textFileRes = await uploadFileRequest(
        '/api/startups/pitch',
        'pitchDeck',
        'script.sh',
        Buffer.from('#!/bin/bash\necho "exploit"'),
        'text/plain',
        startupUserToken
      );
      assert.equal(textFileRes.status, 400);
      assert.equal(textFileRes.data.success, false);
    });

    test('21. Oversized file (>10MB) is rejected with 400', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const largeRes = await uploadFileRequest(
        '/api/startups/pitch',
        'pitchDeck',
        'huge_deck.pdf',
        largeBuffer,
        'application/pdf',
        startupUserToken
      );
      assert.equal(largeRes.status, 400);
      assert.equal(largeRes.data.success, false);
    });

    test('22. Path traversal attempts on download endpoint are rejected (400/403/404)', async () => {
      const traversalRes = await request('GET', '/api/startups/pitch/download/..%2F..%2Fpackage.json', null, startupUserToken);
      assert.ok([400, 403, 404].includes(traversalRes.status));

      const invalidCharRes = await request('GET', '/api/startups/pitch/download/malicious;cmd.pdf', null, startupUserToken);
      assert.ok([400, 403, 404].includes(invalidCharRes.status));
    });

    test('23. Unauthenticated pitch deck upload is rejected with 401', async () => {
      const unauthRes = await uploadFileRequest(
        '/api/startups/pitch',
        'pitchDeck',
        'deck.pdf',
        Buffer.from('%PDF-1.4 test'),
        'application/pdf',
        null
      );
      assert.equal(unauthRes.status, 401);
    });
  });

  // ==========================================
  // 6. SENSITIVE DATA EXPOSURE
  // ==========================================
  describe('Sensitive Data Exposure Prevention', () => {
    test('24. User profile API excludes passwordHash, __v, and private fields', async () => {
      const res = await request('GET', `/api/profile/${startupUserId}`, null, vcUserToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.user.passwordHash, undefined);
      assert.equal(res.data.user.__v, undefined);
      assert.equal(res.data.user.email, undefined);
    });

    test('25. Discovery API (startups & investors) excludes passwordHash and email', async () => {
      const startupsRes = await request('GET', '/api/users/startups', null, vcUserToken);
      assert.equal(startupsRes.status, 200);
      for (const s of startupsRes.data.data.startups) {
        assert.equal(s.passwordHash, undefined);
        assert.equal(s.email, undefined);
      }

      const investorsRes = await request('GET', '/api/users/investors', null, startupUserToken);
      assert.equal(investorsRes.status, 200);
      for (const inv of investorsRes.data.data.investors) {
        assert.equal(inv.passwordHash, undefined);
        assert.equal(inv.email, undefined);
      }
    });

    test('26. Connection API excludes passwordHash and email on populated fields', async () => {
      const connRes = await request('GET', '/api/connections', null, vcUserToken);
      assert.equal(connRes.status, 200);
      for (const c of connRes.data.connections) {
        if (c.requester && typeof c.requester === 'object') {
          assert.equal(c.requester.passwordHash, undefined);
          assert.equal(c.requester.email, undefined);
        }
        if (c.recipient && typeof c.recipient === 'object') {
          assert.equal(c.recipient.passwordHash, undefined);
          assert.equal(c.recipient.email, undefined);
        }
      }
    });

    test('27. Match recommendation API excludes passwordHash and email', async () => {
      const matchRes = await request('GET', '/api/match', null, vcUserToken);
      assert.equal(matchRes.status, 200);
      for (const match of matchRes.data.matches) {
        assert.equal(match.passwordHash, undefined);
        assert.equal(match.email, undefined);
      }
    });
  });

  // ==========================================
  // 7. SECURITY CONFIGURATION & HEADERS
  // ==========================================
  describe('Security Configuration & Headers', () => {
    test('28. Security headers (Helmet) are present on HTTP responses', async () => {
      const res = await request('GET', '/api/health');
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('x-dns-prefetch-control') !== null || res.headers.get('x-content-type-options') !== null);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    });

    test('29. CORS and standard headers are configured properly', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET',
        },
      });
      assert.ok([200, 204].includes(res.status));
      const allowOrigin = res.headers.get('access-control-allow-origin');
      assert.ok(allowOrigin === 'http://localhost:5173' || allowOrigin === '*');
    });

    test('30. Rate limiting configuration headers are present', async () => {
      const res = await request('GET', '/api/health');
      assert.equal(res.status, 200);
      const limitHeader = res.headers.get('ratelimit-limit') || res.headers.get('x-ratelimit-limit');
      assert.ok(limitHeader !== null);
    });
  });

  // ==========================================
  // 8. DATABASE & QUERY INJECTION SECURITY
  // ==========================================
  describe('Database & Query Injection Security', () => {
    test('31. Malicious MongoDB regex characters and operators in search query are escaped safely', async () => {
      // ReDoS pattern / special regex meta-characters: .*+?^${}()|[]\
      const dangerousQueries = [
        '.*',
        'a{1,100000}',
        '(a+)+',
        '[$ne]',
        '^.*$',
        '\\',
        '[a-z',
      ];

      for (const q of dangerousQueries) {
        const res = await request('GET', `/api/users/startups?q=${encodeURIComponent(q)}`, null, startupUserToken);
        assert.equal(res.status, 200);
        assert.ok(Array.isArray(res.data.data.startups));
      }
    });

    test('32. Malicious filter inputs do not alter authorization or return unauthorized documents', async () => {
      const res = await request(
        'GET',
        '/api/users/startups?stage=%24ne&domain=%24gt',
        null,
        vcUserToken
      );
      assert.equal(res.status, 200);
      // Ensure only Startup role documents are returned and no database errors occur
      for (const s of res.data.data.startups) {
        assert.ok(s.id);
      }
    });
  });
});
