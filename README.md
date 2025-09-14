# LockMiNDS
**Enterprise-Grade Password Manager with Zero-Trust Architecture**

LockMiNDS is a cross-platform password manager built with modern security principles, featuring quantum-resistant encryption, zero-trust architecture, and enterprise-grade authentication methods.

## 🚀 **One-Click Installation**

### **For Everyone (Recommended)**
```bash
# Download and run - that's it!
npx lockminds@latest
```

### **For Developers**
```bash
# Clone and install
git clone https://github.com/yourusername/lockminds.git
cd lockminds
npm install
npm run setup
```

**That's it!** No configuration needed. The app will:
- ✅ Automatically generate secure keys
- ✅ Set up the database
- ✅ Start the server
- ✅ Open in your browser

## 🎯 **Quick Start**

1. **Install:** `npx lockminds@latest`
2. **Open:** http://localhost:3001
3. **Create account:** Set up your master password
4. **Start using:** Add your first password entry

## 🔐 Security Features

### Zero-Trust Architecture
- **Client-side encryption/decryption only** - No sensitive data ever stored in plaintext
- **AES-GCM encryption** with 256-bit keys and authenticated encryption
- **PBKDF2 key derivation** with 100,000 iterations and random salts
- **Random IVs** for every encryption operation

### Advanced Authentication
- **WebAuthn/FIDO2** support for passwordless authentication
- **Biometric authentication** integration ready
- **TOTP (Time-based One-Time Password)** generator
- **Risk-based authentication** engine
- **OIDC federation** support

### Enterprise Features
- **Multi-device synchronization** with encrypted cloud backup
- **Device management** and trust verification
- **Audit logging** and security monitoring
- **External system integrations** for enterprise environments

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for state management
- **Shadcn/UI** with Tailwind CSS
- **Framer Motion** for animations

### Backend  
- **Express.js** with TypeScript
- **Drizzle ORM** with SQLite (auto-configured)
- **JWT** authentication with RSA signing
- **WebAuthn** server implementation
- **Rate limiting** and security middleware

### Security & Crypto
- **Web Crypto API** for client-side encryption
- **Node.js Crypto** for server-side operations
- **bcrypt** for password hashing
- **jsonwebtoken** for session management

## 📦 **Installation Options**

### **Option 1: NPX (Easiest)**
```bash
npx lockminds@latest
```
*Perfect for trying out the app*

### **Option 2: NPM Global**
```bash
npm install -g lockminds
lockminds
```
*Great for regular use*

### **Option 3: Local Development**
```bash
git clone https://github.com/yourusername/lockminds.git
cd lockminds
npm install
npm run setup
```
*Best for developers*

### **Option 4: Docker**
```bash
docker run -p 3001:3001 lockminds/lockminds
```
*Perfect for servers*

## 🎯 Usage

### Getting Started
1. **Create Master Account** - Set up your primary authentication
2. **Add Your First Entry** - Store login credentials or payment cards
3. **Configure Settings** - Set up backup, sync, and security preferences
4. **Install Browser Extension** - For seamless password autofill (coming soon)

### Key Features
- **Password Generation** - Create strong, unique passwords
- **Secure Storage** - All data encrypted before storage
- **Quick Search** - Find entries instantly
- **Category Organization** - Organize by type or custom tags
- **Backup & Sync** - Multi-device synchronization with encryption

## 🛡️ Security Principles

### Zero-Trust Design
- **No plaintext storage** - All sensitive data encrypted client-side
- **Minimal server trust** - Authentication backends verify identity only
- **End-to-end encryption** - Data encrypted before transmission
- **Forward secrecy** - Each session uses unique encryption parameters

### Threat Model Protection
- **Data breach protection** - Encrypted data is useless without master password
- **Network interception** - All data encrypted in transit
- **Malicious server** - Server cannot access vault contents
- **Device compromise** - Local data encrypted at rest

## 🔧 Development

### Project Structure
```
lockminds/
├── client/src/           # React frontend
│   ├── components/       # UI components
│   ├── lib/             # Utilities and encryption
│   └── pages/           # Application pages
├── server/              # Express backend
│   ├── middleware/      # Authentication & security
│   ├── routes/          # API endpoints
│   └── services/        # Business logic
├── shared/              # Common types and schemas
├── install.js           # Automated setup script
└── package.json         # Dependencies and scripts
```

### Available Scripts
- `npm run setup` - Automated installation and configuration
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Sync database schema

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📋 Roadmap

### Phase 1 (Current)
- ✅ Zero-trust encryption implementation
- ✅ Core password management features
- ✅ Modern React UI with dark theme
- ✅ WebAuthn authentication foundation
- ✅ One-click installation

### Phase 2 (Planned)
- [ ] Browser extension for autofill
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced import/export features
- [ ] Team sharing and collaboration

### Phase 3 (Future)
- [ ] Hardware security key integration
- [ ] Advanced threat detection
- [ ] Enterprise SSO integration
- [ ] Compliance reporting tools

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support, feature requests, or bug reports:
- Open an issue on GitHub
- Contact: support@acminds.com
- Documentation: https://docs.acminds.com

## 🔒 Security Disclosure

Found a security vulnerability? Please report it responsibly:
- Email: security@acminds.com
- PGP Key: [Available on request]
- We'll respond within 24 hours

---

**Built with security first. Your data, your control.**