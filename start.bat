@echo off
echo 🚀 Starting LockMiNDS...
echo 🔍 Finding available port...
set SESSION_SECRET=003818f924a7cb1dda6a816d67765fb2904df1671d08b324ffaae16b20298809
set DATABASE_URL=file:./data/lockminds.db
REM PORT will be auto-detected by the app
npm run dev
