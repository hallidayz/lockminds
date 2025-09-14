import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, EyeOff, CheckCircle2, Fingerprint, Smartphone, Zap } from "lucide-react";
import lockMindLogo from "@assets/LockingMiNDS.png";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MasterPasswordScreenProps {
  onLogin: (email: string, masterPassword: string) => void;
  onBiometricLogin: () => void;
  onWebAuthnLogin: () => void;
  onPasswordlessLogin: (email: string) => void;
  encryptionStatus?: string;
  isLoading?: boolean;
  supportsBiometric?: boolean;
  supportsWebAuthn?: boolean;
  isAuthenticated?: boolean;
}

export default function MasterPasswordScreen({ 
  onLogin,
  onBiometricLogin,
  onWebAuthnLogin,
  onPasswordlessLogin,
  encryptionStatus = "initializing",
  isLoading = false,
  supportsBiometric = true,
  supportsWebAuthn = true,
  isAuthenticated = false
}: MasterPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"password" | "biometric" | "webauthn" | "passwordless">("password");
  
  // Password reset state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState<'email' | 'token' | 'password'>('email');
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  
  // Registration state
  const [showRegistration, setShowRegistration] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmRegPassword, setConfirmRegPassword] = useState("");
  const [regMessage, setRegMessage] = useState("");
  const [regError, setRegError] = useState("");

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showRegistration) {
        setShowRegistration(false);
        setRegEmail("");
        setRegPassword("");
        setConfirmRegPassword("");
        setRegMessage("");
        setRegError("");
      }
    };

    if (showRegistration) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showRegistration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, passwordLength: masterPassword.length });
    onLogin(email, masterPassword);
  };

  const handlePasswordReset = async () => {
    try {
      setResetError("");
      setResetMessage("");
      
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResetMessage(data.message);
        if (data.resetToken) {
          setResetToken(data.resetToken);
          setResetStep('password');
        } else {
          setResetStep('token');
        }
      } else {
        setResetError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      setResetError('Network error. Please try again.');
    }
  };

  const handlePasswordResetComplete = async () => {
    try {
      setResetError("");
      setResetMessage("");
      
      if (newPassword !== confirmPassword) {
        setResetError("Passwords don't match");
        return;
      }
      
      if (newPassword.length < 8) {
        setResetError("Password must be at least 8 characters long");
        return;
      }
      
      const response = await fetch('/api/auth/password-reset/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: resetToken, 
          newPassword: newPassword 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResetMessage(data.message);
        // Reset the form
        setShowForgotPassword(false);
        setResetStep('email');
        setResetEmail("");
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setResetError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      setResetError('Network error. Please try again.');
    }
  };

  const handleRegistration = async () => {
    try {
      setRegError("");
      setRegMessage("");
      
      if (regPassword !== confirmRegPassword) {
        setRegError("Passwords don't match");
        return;
      }
      
      if (regPassword.length < 8) {
        setRegError("Password must be at least 8 characters long");
        return;
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: regEmail, 
          password: regPassword 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRegMessage("Account created successfully! You can now log in.");
        // Reset the form
        setShowRegistration(false);
        setRegEmail("");
        setRegPassword("");
        setConfirmRegPassword("");
        // Pre-fill the login form with the registered email
        setEmail(regEmail);
      } else {
        setRegError(data.error || 'Failed to create account');
      }
    } catch (error) {
      setRegError('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "initializing": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-red-500/20 text-red-400";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3">
            <img src={lockMindLogo} alt="LockingMiNDS" className="h-12 w-12" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-blue-600 bg-clip-text text-transparent">
              LockingMiNDS
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            AI-Powered Security & Identity Platform
          </p>
        </div>

        {/* Encryption Status */}
        <div className="flex items-center justify-center">
          <Badge 
            className={`${getStatusColor(encryptionStatus)} border-0`}
            data-testid="status-encryption"
          >
            <Lock className="h-3 w-3 mr-1" />
            Encryption: {encryptionStatus}
          </Badge>
        </div>

        {/* Authentication Methods */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <Button
            variant={authMode === "password" ? "default" : "outline"}
            size="sm"
            onClick={() => setAuthMode("password")}
            data-testid="button-auth-password"
          >
            <Lock className="h-4 w-4 mr-1" />
            Password
          </Button>
          {supportsBiometric && (
            <Button
              variant={authMode === "biometric" ? "default" : "outline"}
              size="sm"
              onClick={() => setAuthMode("biometric")}
              data-testid="button-auth-biometric"
            >
              <Fingerprint className="h-4 w-4 mr-1" />
              Biometric
            </Button>
          )}
          {supportsWebAuthn && (
            <Button
              variant={authMode === "webauthn" ? "default" : "outline"}
              size="sm"
              onClick={() => setAuthMode("webauthn")}
              data-testid="button-auth-webauthn"
            >
              <Shield className="h-4 w-4 mr-1" />
              FIDO2
            </Button>
          )}
          <Button
            variant={authMode === "passwordless" ? "default" : "outline"}
            size="sm"
            onClick={() => setAuthMode("passwordless")}
            data-testid="button-auth-passwordless"
          >
            <Smartphone className="h-4 w-4 mr-1" />
            Passwordless
          </Button>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">
              {authMode === "password" && "Master Password"}
              {authMode === "biometric" && "Biometric Authentication"}
              {authMode === "webauthn" && "WebAuthn/FIDO2"}
              {authMode === "passwordless" && "Passwordless Login"}
            </CardTitle>
            <CardDescription>
              {authMode === "password" && "Enter your credentials to unlock your vault"}
              {authMode === "biometric" && "Use your fingerprint or face recognition"}
              {authMode === "webauthn" && "Authenticate with your security key or device"}
              {authMode === "passwordless" && "Enter your email for magic link authentication"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authMode === "password" && (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="master-password">Master Password</Label>
                <div className="relative">
                  <Input
                    id="master-password"
                    type={showPassword ? "text" : "password"}
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="Enter your master password"
                    required
                    disabled={isLoading}
                    data-testid="input-master-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading || !email || !masterPassword}
                  data-testid="button-login"
                >
                  {isLoading ? "Authenticating..." : "Unlock Vault"}
                </Button>
                
                <div className="text-center mt-4 space-y-2">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-primary"
                    onClick={() => setShowForgotPassword(true)}
                    data-testid="button-forgot-password"
                  >
                    Forgot your password?
                  </Button>
                  {!isAuthenticated && (
                    <div>
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm text-muted-foreground hover:text-primary"
                        onClick={() => setShowRegistration(true)}
                        data-testid="button-sign-up"
                      >
                        Don't have an account? Sign up
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            )}

            {authMode === "biometric" && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Fingerprint className="h-16 w-16 mx-auto text-primary mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Touch the sensor or look at your camera to authenticate
                  </p>
                  <Button
                    onClick={onBiometricLogin}
                    disabled={isLoading}
                    className="w-full"
                    data-testid="button-biometric-auth"
                  >
                    <Fingerprint className="h-4 w-4 mr-2" />
                    {isLoading ? "Authenticating..." : "Authenticate with Biometrics"}
                  </Button>
                </div>
              </div>
            )}

            {authMode === "webauthn" && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Shield className="h-16 w-16 mx-auto text-primary mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Use your security key, Touch ID, Face ID, or Windows Hello
                  </p>
                  <Button
                    onClick={onWebAuthnLogin}
                    disabled={isLoading}
                    className="w-full"
                    data-testid="button-webauthn-auth"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {isLoading ? "Authenticating..." : "Authenticate with WebAuthn"}
                  </Button>
                </div>
              </div>
            )}

            {authMode === "passwordless" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordless-email">Email</Label>
                  <Input
                    id="passwordless-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={isLoading}
                    data-testid="input-passwordless-email"
                  />
                </div>
                <Button
                  onClick={() => onPasswordlessLogin(email)}
                  disabled={isLoading || !email}
                  className="w-full"
                  data-testid="button-passwordless-auth"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isLoading ? "Sending..." : "Send Magic Link"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We'll send a secure authentication link to your email
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Reset Modal */}
        {showForgotPassword && (
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Reset Password</CardTitle>
              <CardDescription>
                {resetStep === 'email' && "Enter your email to receive a reset link"}
                {resetStep === 'token' && "Check your email and enter the reset token"}
                {resetStep === 'password' && "Enter your new password"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetStep === 'email' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <Button
                    onClick={handlePasswordReset}
                    disabled={!resetEmail}
                    className="w-full"
                  >
                    Send Reset Link
                  </Button>
                </div>
              )}
              
              {resetStep === 'token' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-token">Reset Token</Label>
                    <Input
                      id="reset-token"
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Enter the token from your email"
                      required
                    />
                  </div>
                  <Button
                    onClick={() => setResetStep('password')}
                    disabled={!resetToken}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              )}
              
              {resetStep === 'password' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <Button
                    onClick={handlePasswordResetComplete}
                    disabled={!newPassword || !confirmPassword}
                    className="w-full"
                  >
                    Reset Password
                  </Button>
                </div>
              )}
              
              {resetMessage && (
                <div className="text-sm text-green-600 text-center">
                  {resetMessage}
                </div>
              )}
              
              {resetError && (
                <div className="text-sm text-red-600 text-center">
                  {resetError}
                </div>
              )}
              
              <div className="text-center mt-4">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetStep('email');
                    setResetEmail("");
                    setResetToken("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setResetMessage("");
                    setResetError("");
                  }}
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Modal */}
        {showRegistration && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowRegistration(false);
              setRegEmail("");
              setRegPassword("");
              setConfirmRegPassword("");
              setRegMessage("");
              setRegError("");
            }}
          >
            <div 
              className="bg-background rounded-lg shadow-lg w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0 shadow-none">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">Create Account</CardTitle>
                  <CardDescription>
                    Create a new LockingMiNDS account to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        autoFocus
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create a strong password"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-reg-password">Confirm Password</Label>
                      <Input
                        id="confirm-reg-password"
                        type="password"
                        value={confirmRegPassword}
                        onChange={(e) => setConfirmRegPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleRegistration}
                        disabled={!regEmail || !regPassword || !confirmRegPassword}
                        className="flex-1"
                      >
                        Create Account
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowRegistration(false);
                          setRegEmail("");
                          setRegPassword("");
                          setConfirmRegPassword("");
                          setRegMessage("");
                          setRegError("");
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    {regMessage && (
                      <div className="text-sm text-green-600 text-center">
                        {regMessage}
                      </div>
                    )}
                    
                    {regError && (
                      <div className="text-sm text-red-600 text-center">
                        {regError}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Security Features */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Zero-Knowledge</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>FIDO2/WebAuthn</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Quantum-Resistant</span>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Risk-Based Auth</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>OIDC</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>TOTP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}