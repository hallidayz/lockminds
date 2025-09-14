#!/usr/bin/env node

// Simple test script for LockingMiNDS
console.log('🧪 Testing LockingMiNDS App...\n');

// Test 1: Check if we're in the right directory
const fs = require('fs');
const path = require('path');

console.log('1️⃣ Checking directory structure...');
if (fs.existsSync('package.json') && fs.existsSync('server/index.ts')) {
  console.log('   ✅ Correct directory structure found');
} else {
  console.log('   ❌ Wrong directory - please run from lockminds folder');
  process.exit(1);
}

// Test 2: Check if .env file exists
console.log('\n2️⃣ Checking environment configuration...');
if (fs.existsSync('.env')) {
  console.log('   ✅ .env file found');
} else {
  console.log('   ⚠️  .env file not found - creating one...');
  const envContent = `SESSION_SECRET=12b7106ef4d39f0e9366dad25473e3a52c925d588886faadb003f166247bb332
DATABASE_URL=file:./data/lockminds.db
PORT=3001
NODE_ENV=development`;
  fs.writeFileSync('.env', envContent);
  console.log('   ✅ .env file created');
}

// Test 3: Check if node_modules exists
console.log('\n3️⃣ Checking dependencies...');
if (fs.existsSync('node_modules')) {
  console.log('   ✅ Dependencies installed');
} else {
  console.log('   ⚠️  Dependencies not found - installing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('   ✅ Dependencies installed');
  } catch (error) {
    console.log('   ❌ Failed to install dependencies');
    process.exit(1);
  }
}

// Test 4: Try to start the app
console.log('\n4️⃣ Starting LockingMiNDS app...');
console.log('   🚀 Starting development server...');
console.log('   🌐 App will be available at: http://localhost:3001');
console.log('   📱 Or try: http://127.0.0.1:3001');
console.log('\n   Press Ctrl+C to stop the server\n');

// Start the app
const { spawn } = require('child_process');
const child = spawn('npm', ['run', 'dev'], { 
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('error', (error) => {
  console.log(`❌ Failed to start app: ${error.message}`);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`\n🏁 App stopped with code ${code}`);
});
