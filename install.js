#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { randomBytes } from 'crypto';
import { join } from 'path';

console.log('🔐 LockMiNDS - Automated Installation');
console.log('=====================================\n');

// Generate secure session secret
const sessionSecret = randomBytes(32).toString('hex');
console.log('✅ Generated secure session secret');

// Create .env file with all required variables
const envContent = `# LockMiNDS Environment Configuration
# This file was automatically generated during installation

# JWT signing secret (automatically generated)
SESSION_SECRET=${sessionSecret}

# Database connection string (using SQLite for easy setup)
DATABASE_URL=file:./data/lockminds.db

# Server port
PORT=3001

# Node environment
NODE_ENV=development
`;

writeFileSync('.env', envContent);
console.log('✅ Created .env configuration file');

// Create data directory for SQLite
if (!existsSync('data')) {
  execSync('mkdir -p data', { stdio: 'inherit' });
  console.log('✅ Created data directory');
}

// Update package.json scripts to include auto-setup
const packageJsonPath = 'package.json';
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Add new scripts for easy installation
packageJson.scripts = {
  ...packageJson.scripts,
  'install:full': 'node install.js && npm install && npm run db:setup && npm run dev',
  'db:setup': 'npm run db:push',
  'start:prod': 'NODE_ENV=production node dist/index.js',
  'postinstall': 'node install.js'
};

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with installation scripts');

// Create a simple start script for Windows users
const startScript = `@echo off
echo Starting LockMiNDS...
set SESSION_SECRET=${sessionSecret}
set DATABASE_URL=file:./data/lockminds.db
set PORT=3001
npm run dev
`;

writeFileSync('start.bat', startScript);
console.log('✅ Created Windows start script');

// Create a simple start script for Mac/Linux users
const startScriptUnix = `#!/bin/bash
echo "Starting LockMiNDS..."
export SESSION_SECRET="${sessionSecret}"
export DATABASE_URL="file:./data/lockminds.db"
export PORT=3001
npm run dev
`;

writeFileSync('start.sh', startScriptUnix);
execSync('chmod +x start.sh', { stdio: 'inherit' });
console.log('✅ Created Unix start script');

console.log('\n🎉 Installation Complete!');
console.log('========================');
console.log('Your LockMiNDS app is ready to use!');
console.log('');
console.log('To start the app:');
console.log('  • Windows: Double-click start.bat');
console.log('  • Mac/Linux: ./start.sh');
console.log('  • Or run: npm run dev');
console.log('');
console.log('The app will be available at: http://localhost:3001');
console.log('');
console.log('🔐 Your session secret has been automatically generated and saved.');
console.log('📁 Database will be created automatically on first run.');
console.log('');
console.log('Enjoy using LockMiNDS! 🚀');
