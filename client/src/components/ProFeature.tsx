import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import PaymentModal from "./PaymentModal";

interface ProFeatureProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
  userAccountType: 'free' | 'pro';
  onUpgrade?: () => void;
}

export default function ProFeature({ 
  children, 
  featureName, 
  description, 
  userAccountType, 
  onUpgrade 
}: ProFeatureProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (userAccountType === 'pro') {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    // Here you would handle the successful payment
    // For now, we'll just close the modal
    setShowPaymentModal(false);
    // You could also trigger a page refresh or update the user's account type
  };

  return (
    <Card className="relative border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg text-orange-800">Pro Feature</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
            <Lock className="h-3 w-3 mr-1" />
            Pro Only
          </Badge>
        </div>
        <CardDescription className="text-orange-700">
          {description || `${featureName} is available with LockingMiNDS Pro`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <div className="blur-sm pointer-events-none select-none">
            {children}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-orange-50/80 to-transparent" />
        </div>
        
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 text-orange-700">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Unlock with LockingMiNDS Pro</span>
          </div>
          
          <Button 
            onClick={handleUpgrade}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
          
          <div className="text-xs text-orange-600">
            Get quantum-resistant encryption, zero-trust architecture, and advanced security features
          </div>
        </div>
      </CardContent>
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Card>
  );
}
