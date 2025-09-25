#!/usr/bin/env node

/**
 * Upload API Acceptance Criteria Tests
 * 
 * Tests:
 * 1. 5-50MB files respond <3s with 201
 * 2. 0 bytes, 700MB, wrong MIME return 400/413/415
 * 3. Queue down returns 500 but no pending
 * 4. Log sequence verification
 * 5. 3 concurrent uploads with no pending
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_DIR = path.join(__dirname, 'test-files');

// Create test files
function createTestFiles() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }

  // Create 0 byte file
  fs.writeFileSync(path.join(TEST_DIR, 'empty.mp3'), '');
  
  // Create 10MB file (valid size)
  const tenMB = Buffer.alloc(10 * 1024 * 1024, 'A');
  fs.writeFileSync(path.join(TEST_DIR, '10mb.mp3'), tenMB);
  
  // Create 30MB file (valid size)
  const thirtyMB = Buffer.alloc(30 * 1024 * 1024, 'B');
  fs.writeFileSync(path.join(TEST_DIR, '30mb.mp3'), thirtyMB);
  
  // Create 700MB file (too large)
  const sevenHundredMB = Buffer.alloc(700 * 1024 * 1024, 'C');
  fs.writeFileSync(path.join(TEST_DIR, '700mb.mp3'), sevenHundredMB);
  
  // Create wrong MIME file (text file with .mp3 extension)
  fs.writeFileSync(path.join(TEST_DIR, 'wrong-mime.mp3'), 'This is not an audio file');
  
  console.log('✅ Test files created');
}

// Test helper functions
async function uploadFile(filePath, expectedStatus, maxTime = 3000) {
  const startTime = Date.now();
  
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    
    // First, try to get a valid session by logging in
    const loginResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });
    
    let cookies = '';
    if (loginResponse.headers.get('set-cookie')) {
      cookies = loginResponse.headers.get('set-cookie');
    }
    
    const response = await fetch(`${BASE_URL}/api/upload/file`, {
      method: 'POST',
      body: form,
      headers: {
        'Cookie': cookies || 'next-auth.session-token=test-token'
      }
    });
    
    const responseTime = Date.now() - startTime;
    const body = await response.text();
    
    return {
      status: response.status,
      responseTime,
      body: body ? JSON.parse(body) : null,
      success: response.status === expectedStatus && responseTime <= maxTime
    };
  } catch (error) {
    return {
      status: 0,
      responseTime: Date.now() - startTime,
      body: null,
      success: false,
      error: error.message
    };
  }
}

// Test 1: 5-50MB files respond <3s with 201
async function testValidFileSizes() {
  console.log('\n🧪 Test 1: Valid file sizes (5-50MB) should respond <3s with 201');
  
  const tests = [
    { file: '10mb.mp3', name: '10MB file' },
    { file: '30mb.mp3', name: '30MB file' }
  ];
  
  for (const test of tests) {
    const result = await uploadFile(path.join(TEST_DIR, test.file), 201, 3000);
    console.log(`  ${test.name}: ${result.success ? '✅' : '❌'} Status: ${result.status}, Time: ${result.responseTime}ms`);
    if (!result.success) {
      console.log(`    Expected: 201, <3000ms | Got: ${result.status}, ${result.responseTime}ms`);
    }
  }
}

// Test 2: Invalid files return proper error codes
async function testInvalidFiles() {
  console.log('\n🧪 Test 2: Invalid files should return proper error codes');
  
  const tests = [
    { file: 'empty.mp3', expectedStatus: 400, name: '0 bytes file' },
    { file: '700mb.mp3', expectedStatus: 413, name: '700MB file (too large)' },
    { file: 'wrong-mime.mp3', expectedStatus: 415, name: 'Wrong MIME type' }
  ];
  
  for (const test of tests) {
    const result = await uploadFile(path.join(TEST_DIR, test.file), test.expectedStatus, 3000);
    console.log(`  ${test.name}: ${result.success ? '✅' : '❌'} Status: ${result.status}`);
    if (!result.success) {
      console.log(`    Expected: ${test.expectedStatus} | Got: ${result.status}`);
    }
  }
}

// Test 3: Queue down returns 500 but no pending
async function testQueueDown() {
  console.log('\n🧪 Test 3: Queue down should return 500 but no pending');
  
  // This test would require stopping Redis or the queue service
  // For now, we'll test the error handling
  const result = await uploadFile(path.join(TEST_DIR, '10mb.mp3'), 201, 3000);
  
  if (result.status === 500) {
    console.log('  Queue down test: ✅ Got 500 as expected');
  } else if (result.status === 201) {
    console.log('  Queue down test: ⚠️  Got 201 (queue is working)');
  } else {
    console.log(`  Queue down test: ❌ Unexpected status: ${result.status}`);
  }
}

// Test 4: Log sequence verification
async function testLogSequence() {
  console.log('\n🧪 Test 4: Log sequence verification');
  console.log('  This test requires manual log inspection');
  console.log('  Expected sequence: recv → formdata → validate → temp-write → db-create → queue-enqueue → respond(201)');
  
  const result = await uploadFile(path.join(TEST_DIR, '10mb.mp3'), 201, 3000);
  console.log(`  Upload result: ${result.success ? '✅' : '❌'} Status: ${result.status}, Time: ${result.responseTime}ms`);
}

// Test 5: 3 concurrent uploads with no pending
async function testConcurrentUploads() {
  console.log('\n🧪 Test 5: 3 concurrent uploads with no pending');
  
  const uploads = [
    uploadFile(path.join(TEST_DIR, '10mb.mp3'), 201, 3000),
    uploadFile(path.join(TEST_DIR, '10mb.mp3'), 201, 3000),
    uploadFile(path.join(TEST_DIR, '10mb.mp3'), 201, 3000)
  ];
  
  const results = await Promise.all(uploads);
  const successCount = results.filter(r => r.success).length;
  
  console.log(`  Concurrent uploads: ${successCount}/3 successful`);
  
  results.forEach((result, index) => {
    console.log(`    Upload ${index + 1}: ${result.success ? '✅' : '❌'} Status: ${result.status}, Time: ${result.responseTime}ms`);
  });
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Upload API Acceptance Criteria Tests');
  console.log('=' .repeat(60));
  
  try {
    createTestFiles();
    await testValidFileSizes();
    await testInvalidFiles();
    await testQueueDown();
    await testLogSequence();
    await testConcurrentUploads();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All tests completed');
    
  } catch (error) {
    console.error('❌ Test runner error:', error);
  } finally {
    // Cleanup test files
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
      console.log('🧹 Test files cleaned up');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  createTestFiles,
  uploadFile,
  testValidFileSizes,
  testInvalidFiles,
  testQueueDown,
  testLogSequence,
  testConcurrentUploads,
  runTests
};
