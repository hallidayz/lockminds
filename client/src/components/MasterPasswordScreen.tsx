import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface MasterPasswordScreenProps {
  onLogin: (email: string, masterPassword: string) => void;
  encryptionStatus?: string;
  isLoading?: boolean;
}

export default function MasterPasswordScreen({ 
  onLogin, 
  encryptionStatus = "initializing",
  isLoading = false 
}: MasterPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold">SecureVault</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Quantum-resistant password manager
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

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Master Password</CardTitle>
            <CardDescription>
              Enter your credentials to unlock your vault
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Security Features */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Zero-Knowledge</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>End-to-End Encrypted</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Quantum-Resistant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}