import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard,
  Shield,
  CheckCircle,
  Crown,
  Lock,
  Zap,
  Star,
  ArrowRight,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (paymentData: PaymentData) => void;
}

interface PaymentData {
  plan: 'monthly' | 'yearly';
  paymentMethod: 'card' | 'paypal' | 'apple' | 'google';
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  name?: string;
  email?: string;
}

const PRICING_PLANS = {
  monthly: {
    price: 9.99,
    period: 'month',
    savings: null,
    popular: false
  },
  yearly: {
    price: 99.99,
    period: 'year',
    savings: '17%',
    popular: true
  }
};

const PRO_FEATURES = [
  {
    icon: Shield,
    title: "Quantum-Resistant Encryption",
    description: "Advanced lattice-based encryption for future-proof security"
  },
  {
    icon: Zap,
    title: "Zero-Trust Architecture",
    description: "All encryption happens locally - no data leaves your device"
  },
  {
    icon: Lock,
    title: "Real-Time Threat Detection",
    description: "Anti-clickjacking and suspicious activity monitoring"
  },
  {
    icon: Crown,
    title: "Built-In MFA Generator",
    description: "Native TOTP codes with encrypted storage"
  },
  {
    icon: Star,
    title: "Push Notifications",
    description: "Real-time security alerts across all devices"
  }
];

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess }: PaymentModalProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'apple' | 'google'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<PaymentData>({
    plan: 'yearly',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: ''
  });

  const handleInputChange = (field: keyof PaymentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCardNumberChange = (value: string) => {
    // Format card number with spaces
    const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    if (formatted.length <= 19) { // 16 digits + 3 spaces
      handleInputChange('cardNumber', formatted);
    }
  };

  const handleExpiryChange = (value: string) => {
    // Format expiry date as MM/YY
    const formatted = value.replace(/\D/g, '').replace(/(.{2})/, '$1/').slice(0, 5);
    handleInputChange('expiryDate', formatted);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would integrate with your payment processor
      // For now, we'll simulate a successful payment
      const paymentData: PaymentData = {
        ...formData,
        plan: selectedPlan,
        paymentMethod
      };
      
      toast({
        title: "Payment Successful! 🎉",
        description: "Welcome to LockingMiNDS Pro! Your account has been upgraded.",
      });
      
      onPaymentSuccess?.(paymentData);
      onClose();
      
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPlan = PRICING_PLANS[selectedPlan];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Upgrade to LockingMiNDS Pro</DialogTitle>
                <DialogDescription>
                  Unlock advanced security features and quantum-resistant encryption
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pricing Plans */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Plan</h3>
              <div className="space-y-3">
                {Object.entries(PRICING_PLANS).map(([key, plan]) => (
                  <Card 
                    key={key}
                    className={`cursor-pointer transition-all ${
                      selectedPlan === key 
                        ? 'ring-2 ring-orange-500 bg-orange-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPlan(key as 'monthly' | 'yearly')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedPlan === key 
                              ? 'border-orange-500 bg-orange-500' 
                              : 'border-gray-300'
                          }`}>
                            {selectedPlan === key && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold capitalize">{key} Plan</div>
                            <div className="text-sm text-muted-foreground">
                              Billed {plan.period}ly
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${plan.price}</div>
                          {plan.savings && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Save {plan.savings}
                            </Badge>
                          )}
                          {plan.popular && (
                            <Badge className="bg-orange-500 text-white">Most Popular</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Pro Features */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Pro Features</h3>
              <div className="space-y-3">
                {PRO_FEATURES.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <feature.icon className="h-3 w-3 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{feature.title}</div>
                      <div className="text-xs text-muted-foreground">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <Label className="text-sm font-medium">Payment Method</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { id: 'card', label: 'Credit Card', icon: CreditCard },
                    { id: 'paypal', label: 'PayPal', icon: CreditCard },
                    { id: 'apple', label: 'Apple Pay', icon: CreditCard },
                    { id: 'google', label: 'Google Pay', icon: CreditCard }
                  ].map((method) => (
                    <Button
                      key={method.id}
                      variant={paymentMethod === method.id ? "default" : "outline"}
                      className="h-12 justify-start"
                      onClick={() => setPaymentMethod(method.id as any)}
                    >
                      <method.icon className="h-4 w-4 mr-2" />
                      {method.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Card Details Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                        className="mt-1"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Cardholder Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Other Payment Methods */}
              {paymentMethod !== 'card' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-muted-foreground">
                    {paymentMethod === 'paypal' && 'You will be redirected to PayPal to complete your payment.'}
                    {paymentMethod === 'apple' && 'Use Touch ID or Face ID to complete your payment with Apple Pay.'}
                    {paymentMethod === 'google' && 'Use your Google account to complete your payment with Google Pay.'}
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>LockingMiNDS Pro ({selectedPlan})</span>
                  <span>${currentPlan.price}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Billed {currentPlan.period}ly</span>
                  <span>Cancel anytime</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${currentPlan.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>Your payment is secured with 256-bit SSL encryption. We never store your payment details.</p>
              </div>
            </div>

            {/* Payment Button */}
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5" />
                  <span>Upgrade to Pro - ${currentPlan.price}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
