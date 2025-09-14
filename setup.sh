#!/bin/bash
echo "🔐 Setting up LockMiNDS..."

# Generate secure secret
SECRET=$(openssl rand -hex 32)
echo "Generated SESSION_SECRET: $SECRET"

# Create .env file
cat > .env << EOF
SESSION_SECRET=$SECRET
DATABASE_URL=postgresql://lockminds:your-secure-password@localhost:5432/lockminds
PORT=3001
EOF

echo "✅ Environment configured!"
echo "📝 Edit .env to update DATABASE_URL with your database details"
echo "🚀 Run 'npm run dev' to start the application"
echo ""
echo "🐳 Or use Docker: docker-compose up"
