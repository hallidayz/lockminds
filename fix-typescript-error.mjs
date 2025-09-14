#!/usr/bin/env node

// Fix TypeScript error in index-fixed.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing TypeScript error in index-fixed.ts...\n');

// Read the current server file
const serverPath = path.join(__dirname, 'server', 'index-fixed.ts');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Fix the TypeScript error with address.port
console.log('1️⃣ Fixing TypeScript error with address.port...');
serverContent = serverContent.replace(
  `      testServer.listen(port, '0.0.0.0', () => {
        const foundPort = testServer.address()?.port;
        testServer.close(() => {
          resolve(foundPort || port);
        });
      });`,
  `      testServer.listen(port, '0.0.0.0', () => {
        const address = testServer.address();
        const foundPort = typeof address === 'object' ? address?.port : port;
        testServer.close(() => {
          resolve(foundPort || port);
        });
      });`
);

// Write the fixed content back
fs.writeFileSync(serverPath, serverContent);
console.log('   ✅ TypeScript error fixed');

console.log('\n🎉 TypeScript error has been fixed!');
console.log('\n🚀 Your app should now work without errors!');
