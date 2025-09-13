# Cross-Platform Password Manager Design Guidelines

## Design Approach
**Selected Approach**: Design System + Security-Focused Hybrid
**Primary Reference**: Bitwarden, 1Password, and Linear (for their security-focused, professional interfaces)
**Justification**: Security applications require trust through visual professionalism while maintaining excellent usability for daily use.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary** (default):
- Background: 220 15% 8%
- Surface: 220 15% 12% 
- Primary: 220 90% 56% (security blue)
- Text: 220 10% 95%
- Success: 142 76% 36%
- Warning: 38 92% 50%
- Error: 0 84% 60%

**Light Mode** (optional):
- Background: 220 10% 98%
- Surface: 220 20% 100%
- Primary: 220 90% 40%
- Text: 220 20% 15%

### B. Typography
**Fonts**: Inter (primary), JetBrains Mono (passwords/codes)
- Headers: Inter 600 (Semi-bold)
- Body: Inter 400 (Regular)
- Passwords/Technical: JetBrains Mono 400
- UI Elements: Inter 500 (Medium)

### C. Layout System
**Tailwind Spacing**: Use units of 1, 2, 4, 6, 8, 12, 16
- Micro spacing: 1-2 (buttons, form elements)
- Component spacing: 4-6 (cards, sections)
- Layout spacing: 8-12 (page margins, major sections)
- Page spacing: 16+ (hero sections, major layout breaks)

### D. Component Library

**Navigation**:
- Sidebar navigation with security status indicator
- Top bar with search and user profile
- Breadcrumb navigation for vault organization

**Core UI Elements**:
- Vault entry cards with security strength indicators
- Password strength meters with color-coded feedback
- Security alert badges and notification toasts
- Encrypted field inputs with show/hide toggles
- Master password unlock modal with biometric option

**Forms**:
- Secure input fields with real-time validation
- Password generator with customizable options
- Two-factor authentication code input
- Import/export wizards with security warnings

**Data Displays**:
- Vault item list with search and filtering
- Security audit dashboard with threat indicators
- Activity logs with timestamp and action details
- Backup status and sync indicators

**Security Overlays**:
- Screen lock overlay with auto-lock timer
- Secure clipboard notification
- Anti-clickjacking warning modals
- Zero-knowledge proof status indicators

### E. Animations
**Minimal Security-Focused**:
- Subtle fade transitions (150ms) for sensitive data reveal
- Loading states for encryption/decryption operations
- Success animations for secure actions (password copied, vault locked)
- **No** distracting animations during security-critical operations

## Security-First Visual Principles

**Trust Through Professionalism**:
- Clean, minimal interface reducing cognitive load
- Consistent iconography using Heroicons (outline style)
- High contrast ratios for accessibility and clarity
- Professional typography hierarchy establishing information priority

**Security Status Communication**:
- Color-coded security strength indicators
- Visual feedback for encrypted vs. unencrypted states
- Clear visual distinction between secure and warning states
- Prominent display of lock status and session timeout

**User Confidence**:
- Immediate visual feedback for all security actions
- Clear visual hierarchies for critical vs. routine operations
- Consistent spacing and alignment reinforcing stability
- Dark mode default to reduce eye strain during extended use

**Key Visual Elements**:
- Lock/unlock icons prominently displayed
- Shield icons for security features
- Eye icons for password visibility toggles
- Copy icons with success feedback
- Warning triangles for security alerts

This design approach prioritizes user trust and security confidence while maintaining the usability needed for a daily-use application.