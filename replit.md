# LockMiNDS Security Platform

## Overview

LockMiNDS is a comprehensive cross-platform password manager and security platform built with advanced authentication technologies. The application features quantum-resistant encryption, WebAuthn/FIDO2 biometric authentication, zero-knowledge architecture, and comprehensive anti-clickjacking protection. It provides secure vault management for passwords and payment cards, with real-time threat detection and risk-based authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for development and build
- **UI System**: Shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system focused on security-first UX
- **State Management**: React hooks with TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Design Philosophy**: Security-focused interface inspired by Bitwarden, 1Password, and Linear

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **Authentication**: Multi-layered approach with JWT tokens, WebAuthn/FIDO2, and biometric authentication
- **Security Features**: Zero-knowledge architecture, quantum-resistant encryption placeholders, risk-based authentication
- **Session Management**: Comprehensive session tracking with device fingerprinting and risk scoring
- **API Design**: RESTful endpoints with OIDC/OAuth2 provider capabilities

### Database & Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Provider**: Neon Database (serverless PostgreSQL)
- **Schema Design**: Comprehensive security-focused schema including users, vault entries, security logs, WebAuthn credentials, authentication sessions, and device fingerprints
- **Encryption**: Client-side encryption with server storing only encrypted data

### Authentication & Security
- **Multi-Factor Authentication**: WebAuthn/FIDO2, TOTP, push notifications, and biometric authentication
- **Zero-Knowledge Architecture**: Server cannot decrypt user data, all encryption/decryption happens client-side
- **Risk Engine**: Real-time risk assessment based on device, behavior, location, and time patterns
- **Device Fingerprinting**: Advanced device identification for security monitoring
- **Anti-Clickjacking**: Real-time DOM monitoring and threat detection
- **Session Security**: JWT-based access tokens with refresh token rotation and session validation

### Security Services
- **WebAuthn Service**: Full FIDO2/WebAuthn implementation for passwordless authentication
- **Push Notification Service**: Secure MFA challenge delivery system
- **Risk Assessment Engine**: Multi-factor risk scoring and adaptive authentication
- **OIDC Provider**: Complete OpenID Connect server implementation for third-party integrations

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Neon serverless PostgreSQL database driver
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **@simplewebauthn/server** & **@simplewebauthn/browser**: WebAuthn/FIDO2 implementation
- **@tanstack/react-query**: Powerful data synchronization for React applications

### Authentication & Security
- **bcrypt**: Password hashing and verification
- **jsonwebtoken**: JWT token generation and verification for session management
- **jose**: JSON Web Signature and Encryption for OIDC implementation
- **node-forge**: Cryptographic utilities for advanced security features
- **ua-parser-js**: User agent parsing for device fingerprinting

### UI & Design
- **@radix-ui/***: Comprehensive accessible UI primitives (30+ components)
- **tailwindcss**: Utility-first CSS framework with custom security-focused design system
- **lucide-react**: Modern icon library for consistent visual design
- **class-variance-authority**: Type-safe component variant management

### Development & Build
- **vite**: Fast development server and build tool optimized for modern web development
- **esbuild**: Fast JavaScript bundler for production server builds
- **typescript**: Type safety across the entire application stack
- **@hookform/resolvers** & **zod**: Form validation with type-safe schema validation