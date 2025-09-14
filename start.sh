#!/bin/bash
echo "🚀 Starting LockMiNDS..."
echo "🔍 Finding available port..."
export SESSION_SECRET="003818f924a7cb1dda6a816d67765fb2904df1671d08b324ffaae16b20298809"
export DATABASE_URL="file:./data/lockminds.db"
# PORT will be auto-detected by the app
npm run dev
