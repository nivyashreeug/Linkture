const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_jwt_secret_key_for_phase3_validation_only_998877';
process.env.JWT_EXPIRES_IN = '1d';
process.env.PORT = '5003';

const app = require('../src/app');
const User = require('../src/models/User');

let mongod;
let server;
let baseUrl;

// Helper for making JSON HTTP requests
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
  return { status: response.status, data };
};

describe('Linkture Phase 3 Role Workspaces & Data Persistence Suite', () => {
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

  let startupToken;
  let startupId;
  let vcToken;
  let vcId;
  let studentToken;
  let studentId;

  test('Setup: Register test accounts for Startup, VC, and Student', async () => {
    // 1. Startup
    const sRes = await request('POST', '/api/auth/register', {
      fullName: 'Aria Stark',
      email: 'aria@solaraero.io',
      password: 'SecurePassword123!',
      role: 'Startup',
      bio: 'Building autonomous solar drones.',
      location: 'Denver, CO',
      companyName: 'SolarAero',
      startupStage: 'Seed',
      industry: 'Climate',
      pitchDeckUrl: 'https://solaraero.io/deck.pdf',
      teamSize: 4,
    });
    assert.equal(sRes.status, 201);
    startupToken = sRes.data.token;
    startupId = sRes.data.user.id;

    // 2. VC
    const vRes = await request('POST', '/api/auth/register', {
      fullName: 'Raymond Reddington',
      email: 'raymond@blacklistercap.com',
      password: 'SecurePassword123!',
      role: 'VC',
      firmName: 'Blacklister Capital',
      domainInterests: ['Climate', 'AI'],
      investmentStage: ['Seed', 'Series A'],
      ticketSizeMin: 500000,
      ticketSizeMax: 3000000,
    });
    assert.equal(vRes.status, 201);
    vcToken = vRes.data.token;
    vcId = vRes.data.user.id;

    // 3. Student
    const stRes = await request('POST', '/api/auth/register', {
      fullName: 'Leo Fitz',
      email: 'leo@shield.edu',
      password: 'SecurePassword123!',
      role: 'Student',
      institutionName: 'MIT Lab',
      program: 'M.S. Robotics',
      graduationYear: 2026,
    });
    assert.equal(stRes.status, 201);
    studentToken = stRes.data.token;
    studentId = stRes.data.user.id;
  });

  // ====================================================
  // STARTUP WORKSPACE PERSISTENCE TESTS
  // ====================================================

  test('1. Startup can update own workspace details and persist to MongoDB', async () => {
    const updatePayload = {
      bio: 'Next-gen solar drone aerial mapping platform.',
      location: 'Boulder, CO',
      startupProfile: {
        companyName: 'SolarAero Technologies',
        tagline: 'Infinite Endurance Autonomous Drones',
        industry: 'Climate',
        startupStage: 'Seed',
        fundingTarget: 1500000,
        websiteUrl: 'https://solaraerotech.io',
        teamSize: 8,
        foundingYear: 2024,
        problem: 'Traditional aerial surveillance requires frequent battery swaps and high operational overhead.',
        solution: 'Ultra-lightweight solar-embedded wings enabling continuous 48-hour daylight flights.',
        businessModel: 'Hardware sales + SaaS telemetry and automated analytics subscription.',
      },
    };

    const updateRes = await request('PUT', '/api/profile', updatePayload, startupToken);
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.success, true);
    assert.equal(updateRes.data.user.startupProfile.companyName, 'SolarAero Technologies');
    assert.equal(updateRes.data.user.startupProfile.tagline, 'Infinite Endurance Autonomous Drones');
    assert.equal(updateRes.data.user.startupProfile.fundingTarget, 1500000);
    assert.equal(updateRes.data.user.startupProfile.teamSize, 8);
    assert.equal(updateRes.data.user.startupProfile.problem, updatePayload.startupProfile.problem);
    assert.equal(updateRes.data.user.startupProfile.solution, updatePayload.startupProfile.solution);
  });

  test('2. Persisted startup workspace data reloads accurately from MongoDB', async () => {
    const getRes = await request('GET', '/api/profile', null, startupToken);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.data.user.startupProfile.companyName, 'SolarAero Technologies');
    assert.equal(getRes.data.user.startupProfile.fundingTarget, 1500000);
    assert.equal(getRes.data.user.startupProfile.foundingYear, 2024);
    assert.equal(getRes.data.user.location, 'Boulder, CO');
  });

  test('3. Startup cannot update another user\'s profile', async () => {
    const maliciousPayload = {
      id: vcId,
      bio: 'Hacked VC profile',
    };
    const res = await request('PUT', '/api/profile', maliciousPayload, startupToken);
    assert.equal(res.status, 403);
  });

  // ====================================================
  // VC WORKSPACE PERSISTENCE TESTS
  // ====================================================

  test('4. VC can update investment mandate and preferences', async () => {
    const vcPayload = {
      bio: 'Early-stage deeptech and climate venture partner.',
      location: 'New York, NY',
      vcProfile: {
        firmName: 'Blacklister Global Ventures',
        domainInterests: ['Climate', 'AI', 'DeepTech'],
        investmentStage: ['Seed', 'Series A', 'Series B+'],
        ticketSizeMin: 750000,
        ticketSizeMax: 5000000,
        preferredRegions: ['North America', 'Europe'],
        portfolioCount: 14,
      },
    };

    const updateRes = await request('PUT', '/api/profile', vcPayload, vcToken);
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.user.vcProfile.firmName, 'Blacklister Global Ventures');
    assert.equal(updateRes.data.user.vcProfile.ticketSizeMin, 750000);
    assert.equal(updateRes.data.user.vcProfile.ticketSizeMax, 5000000);
    assert.equal(updateRes.data.user.vcProfile.portfolioCount, 14);
    assert.ok(updateRes.data.user.vcProfile.preferredRegions.includes('Europe'));
  });

  test('5. Persisted VC mandate reloads accurately and drives VC dashboard', async () => {
    const dashRes = await request('GET', '/api/users/vc/dashboard', null, vcToken);
    assert.equal(dashRes.status, 200);
    assert.ok(dashRes.data.data.selectedDomains.includes('Climate'));
    assert.ok(dashRes.data.data.selectedDomains.includes('AI'));
  });

  test('6. VC cannot update another user\'s profile', async () => {
    const maliciousPayload = {
      id: studentId,
      fullName: 'Hacked Student',
    };
    const res = await request('PUT', '/api/profile', maliciousPayload, vcToken);
    assert.equal(res.status, 403);
  });

  // ====================================================
  // STUDENT WORKSPACE & LESSON PERSISTENCE TESTS
  // ====================================================

  test('7. Student can update student workspace details', async () => {
    const studentPayload = {
      bio: 'Robotics engineer passionate about hardware startups.',
      location: 'Cambridge, MA',
      skills: ['ROS', 'C++', 'CAD', 'Embedded'],
      interests: ['Robotics', 'Hardware', 'Climate'],
      studentProfile: {
        institutionName: 'MIT Media Lab',
        program: 'M.S. Robotic Systems',
        graduationYear: 2026,
        incubatorName: 'MIT delta v',
        projectLinks: ['https://github.com/fitz/quad-drone', 'https://fitzrobotics.dev'],
      },
    };

    const updateRes = await request('PUT', '/api/profile', studentPayload, studentToken);
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.user.studentProfile.institutionName, 'MIT Media Lab');
    assert.equal(updateRes.data.user.studentProfile.incubatorName, 'MIT delta v');
    assert.equal(updateRes.data.user.studentProfile.projectLinks.length, 2);
  });

  test('8. Student lesson completion and bookmarks persist to MongoDB', async () => {
    const lessonPayload = {
      studentProfile: {
        completedLessons: [1, 2, 4],
        savedLessons: [3, 5],
      },
    };

    const updateRes = await request('PUT', '/api/profile', lessonPayload, studentToken);
    assert.equal(updateRes.status, 200);
    assert.deepEqual(updateRes.data.user.studentProfile.completedLessons, [1, 2, 4]);
    assert.deepEqual(updateRes.data.user.studentProfile.savedLessons, [3, 5]);

    // Verify retrieval after simulated session re-fetch
    const meRes = await request('GET', '/api/auth/me', null, studentToken);
    assert.equal(meRes.status, 200);
    assert.deepEqual(meRes.data.user.studentProfile.completedLessons, [1, 2, 4]);
    assert.deepEqual(meRes.data.user.studentProfile.savedLessons, [3, 5]);
  });

  // ====================================================
  // PITCH DECK UPLOAD, RETRIEVAL & DELETION TESTS
  // ====================================================

  test('9. Startup can upload valid PDF pitch deck document', async () => {
    const dummyPdf = Buffer.from('%PDF-1.4\n%Fake PDF content for Phase 3 integration testing\n%%EOF');

    const uploadRes = await uploadFileRequest(
      '/api/startups/pitch',
      'pitchDeck',
      'SolarAero_SeriesSeed_Deck.pdf',
      dummyPdf,
      'application/pdf',
      startupToken
    );

    assert.equal(uploadRes.status, 200);
    assert.equal(uploadRes.data.success, true);
    assert.ok(uploadRes.data.pitchDeck);
    assert.equal(uploadRes.data.pitchDeck.originalName, 'SolarAero_SeriesSeed_Deck.pdf');
    assert.equal(uploadRes.data.pitchDeck.mimeType, 'application/pdf');
    assert.ok(uploadRes.data.pitchDeckUrl.startsWith('/uploads/pitch-decks/'));
  });

  test('10. Invalid non-PDF file upload is rejected with 400', async () => {
    const dummyTxt = Buffer.from('Plain text file content, not a PDF.');

    const uploadRes = await uploadFileRequest(
      '/api/startups/pitch',
      'pitchDeck',
      'malicious_script.exe',
      dummyTxt,
      'text/plain',
      startupToken
    );

    assert.equal(uploadRes.status, 400);
    assert.match(uploadRes.data.message, /PDF/i);
  });

  test('11. Non-startup accounts cannot upload pitch decks', async () => {
    const dummyPdf = Buffer.from('%PDF-1.4 dummy');

    const studentUploadRes = await uploadFileRequest(
      '/api/startups/pitch',
      'pitchDeck',
      'student_deck.pdf',
      dummyPdf,
      'application/pdf',
      studentToken
    );
    assert.equal(studentUploadRes.status, 403);

    const vcUploadRes = await uploadFileRequest(
      '/api/startups/pitch',
      'pitchDeck',
      'vc_deck.pdf',
      dummyPdf,
      'application/pdf',
      vcToken
    );
    assert.equal(vcUploadRes.status, 403);
  });

  test('12. Pitch deck metadata can be retrieved', async () => {
    const getRes = await request('GET', '/api/startups/pitch', null, startupToken);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.data.hasPitchDeck, true);
    assert.equal(getRes.data.pitchDeck.originalName, 'SolarAero_SeriesSeed_Deck.pdf');
  });

  test('13. Startup can delete own pitch deck', async () => {
    const delRes = await request('DELETE', '/api/startups/pitch', null, startupToken);
    assert.equal(delRes.status, 200);
    assert.equal(delRes.data.success, true);

    const checkRes = await request('GET', '/api/startups/pitch', null, startupToken);
    assert.equal(checkRes.status, 200);
    assert.equal(checkRes.data.hasPitchDeck, false);
  });

  test('14. Unauthenticated pitch deck requests are rejected with 401', async () => {
    const unauthGet = await request('GET', '/api/startups/pitch', null, null);
    assert.equal(unauthGet.status, 401);

    const unauthDel = await request('DELETE', '/api/startups/pitch', null, null);
    assert.equal(unauthDel.status, 401);
  });

  // ====================================================
  // ROLE DISCOVERY & DASHBOARD INTEGRATION TESTS
  // ====================================================

  test('15. Startup discovery endpoint includes updated executive summary & problem statements', async () => {
    const res = await request('GET', '/api/users/startups?q=SolarAero', null, vcToken);
    assert.equal(res.status, 200);
    assert.ok(res.data.data.startups.length >= 1);
    const solar = res.data.data.startups.find((s) => s.id === startupId);
    assert.ok(solar);
    assert.equal(solar.tagline, 'Infinite Endurance Autonomous Drones');
    assert.equal(solar.fundingTarget, 1500000);
    assert.ok(solar.problem.includes('aerial surveillance'));
    assert.ok(solar.solution.includes('solar-embedded wings'));
  });
});
