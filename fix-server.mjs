#!/usr/bin/env node

// Fix script for LockingMiNDS server using ES modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing LockingMiNDS server...\n');

// Read the current server file
const serverPath = path.join(__dirname, 'server', 'index.ts');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Fix the require issue
console.log('1️⃣ Fixing require() issue...');
serverContent = serverContent.replace(
  "import { registerRoutes } from \"./routes\";\nimport { setupVite, serveStatic, log } from \"./vite\";",
  "import { createServer } from 'http';\nimport { registerRoutes } from \"./routes\";\nimport { setupVite, serveStatic, log } from \"./vite\";"
);

serverContent = serverContent.replace(
  "const testServer = require('http').createServer();",
  "const testServer = createServer();"
);

// Write the fixed content back
fs.writeFileSync(serverPath, serverContent);
console.log('   ✅ Server file fixed');

// Create .env file if it doesn't exist
console.log('\n2️⃣ Ensuring .env file exists...');
if (!fs.existsSync('.env')) {
  const envContent = `SESSION_SECRET=12b7106ef4d39f0e9366dad25473e3a52c925d588886faadb003f166247bb332
DATABASE_URL=file:./data/lockminds.db
PORT=3001
NODE_ENV=development`;
  fs.writeFileSync('.env', envContent);
  console.log('   ✅ .env file created');
} else {
  console.log('   ✅ .env file already exists');
}

// Create data directory if it doesn't exist
console.log('\n3️⃣ Ensuring data directory exists...');
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
  console.log('   ✅ Data directory created');
} else {
  console.log('   ✅ Data directory already exists');
}

console.log('\n🎉 All fixes applied! Your app should now work properly.');
console.log('\n🚀 To test your app, run:');
console.log('   npm run dev');
