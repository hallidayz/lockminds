import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  CreditCard, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Shield,
  Check,
  X
} from "lucide-react";

interface AddEntryFormProps {
  onSave: (entry: any) => void;
  onCancel: () => void;
}

export default function AddEntryForm({ onSave, onCancel }: AddEntryFormProps) {
  const [activeTab, setActiveTab] = useState<"login" | "payment">("login");
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    name: "",
    url: "",
    username: "",
    password: "",
    twoFA: ""
  });

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    name: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: ""
  });

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const password = Array.from({ length: 16 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    
    setLoginData(prev => ({ ...prev, password }));
    console.log('Generated secure password');
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: "None", color: "bg-red-500/20 text-red-400" };
    if (password.length < 8) return { strength: "Weak", color: "bg-red-500/20 text-red-400" };
    if (password.length < 12) return { strength: "Medium", color: "bg-yellow-500/20 text-yellow-400" };
    if (password.length >= 16 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*]/.test(password)) {
      return { strength: "Very Strong", color: "bg-green-500/20 text-green-400" };
    }
    return { strength: "Strong", color: "bg-green-500/20 text-green-400" };
  };

  const handleSave = () => {
    if (activeTab === "login") {
      const entry = {
        ...loginData,
        type: "login",
        id: Date.now().toString() // Temporary ID for demo
      };
      console.log('Saving login entry:', entry);
      onSave(entry);
    } else {
      const entry = {
        ...paymentData,
        type: "payment",
        id: Date.now().toString() // Temporary ID for demo
      };
      console.log('Saving payment entry:', entry);
      onSave(entry);
    }
  };

  const isLoginValid = loginData.name && loginData.username && loginData.password;
  const isPaymentValid = paymentData.name && paymentData.cardNumber && paymentData.expiryDate && paymentData.cvv;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Add New Entry</span>
          </CardTitle>
          <CardDescription>
            Create a new vault entry with quantum-resistant encryption
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "payment")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center space-x-2" data-testid="tab-login">
                <Globe className="h-4 w-4" />
                <span>Login</span>
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center space-x-2" data-testid="tab-payment">
                <CreditCard className="h-4 w-4" />
                <span>Payment</span>
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-name">Name *</Label>
                <Input
                  id="login-name"
                  value={loginData.name}
                  onChange={(e) => setLoginData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., GitHub, Gmail, Bank Account"
                  data-testid="input-login-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-url">Website URL</Label>
                <Input
                  id="login-url"
                  type="url"
                  value={loginData.url}
                  onChange={(e) => setLoginData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  data-testid="input-login-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-username">Username/Email *</Label>
                <Input
                  id="login-username"
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="your@email.com"
                  data-testid="input-login-username"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generatePassword}
                    className="text-xs"
                    data-testid="button-generate-password"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter or generate password"
                    data-testid="input-login-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password-visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {loginData.password && (
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getPasswordStrength(loginData.password).color} border-0`}>
                      {getPasswordStrength(loginData.password).strength}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-2fa">2FA Secret (Optional)</Label>
                <Input
                  id="login-2fa"
                  value={loginData.twoFA}
                  onChange={(e) => setLoginData(prev => ({ ...prev, twoFA: e.target.value }))}
                  placeholder="Two-factor authentication secret"
                  data-testid="input-login-2fa"
                />
              </div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-name">Card Name *</Label>
                <Input
                  id="payment-name"
                  value={paymentData.name}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Personal Credit Card, Business Debit"
                  data-testid="input-payment-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-cardholder">Cardholder Name</Label>
                <Input
                  id="payment-cardholder"
                  value={paymentData.cardholderName}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, cardholderName: e.target.value }))}
                  placeholder="Name as it appears on card"
                  data-testid="input-payment-cardholder"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-number">Card Number *</Label>
                <Input
                  id="payment-number"
                  value={paymentData.cardNumber}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  data-testid="input-payment-number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-expiry">Expiry Date *</Label>
                  <Input
                    id="payment-expiry"
                    value={paymentData.expiryDate}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    placeholder="MM/YY"
                    maxLength={5}
                    data-testid="input-payment-expiry"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-cvv">CVV *</Label>
                  <Input
                    id="payment-cvv"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value }))}
                    placeholder="123"
                    maxLength={4}
                    data-testid="input-payment-cvv"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-6 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={activeTab === "login" ? !isLoginValid : !isPaymentValid}
              data-testid="button-save"
            >
              <Check className="h-4 w-4 mr-2" />
              Save Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}