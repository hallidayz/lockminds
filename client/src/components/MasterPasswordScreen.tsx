import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, EyeOff, CheckCircle2, Fingerprint, Smartphone, Zap } from "lucide-react";
import lockMindLogo from "@assets/LockMind_1757775227799.png";

interface MasterPasswordScreenProps {
  onLogin: (email: string, masterPassword: string) => void;
  onBiometricLogin: () => void;
  onWebAuthnLogin: () => void;
  onPasswordlessLogin: (email: string) => void;
  encryptionStatus?: string;
  isLoading?: boolean;
  supportsBiometric?: boolean;
  supportsWebAuthn?: boolean;
}

export default function MasterPasswordScreen({ 
  onLogin,
  onBiometricLogin,
  onWebAuthnLogin,
  onPasswordlessLogin,
  encryptionStatus = "initializing",
  isLoading = false,
  supportsBiometric = true,
  supportsWebAuthn = true
}: MasterPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"password" | "biometric" | "webauthn" | "passwordless">("password");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, passwordLength: masterPassword.length });
    onLogin(email, masterPassword);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "initializing": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-red-500/20 text-red-400";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3">
            <img src={lockMindLogo} alt="LockMind" className="h-12 w-12" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-blue-600 bg-clip-text text-transparent">
              LockMind
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