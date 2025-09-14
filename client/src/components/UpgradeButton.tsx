import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";
import PaymentModal from "./PaymentModal";

interface UpgradeButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export default function UpgradeButton({ 
  variant = "default", 
  size = "default",
  className = "",
  showIcon = true,
  children
}: UpgradeButtonProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePaymentSuccess = (paymentData: any) => {
    // Here you would handle the successful payment
    setShowPaymentModal(false);
    // You could also trigger a page refresh or update the user's account type
  };

  return (
    <>
      <Button 
        onClick={() => setShowPaymentModal(true)}
        variant={variant}
        size={size}
        className={`bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white ${className}`}
      >
        {showIcon && <Crown className="h-4 w-4 mr-2" />}
        {children || "Upgrade to Pro"}
        {showIcon && <Sparkles className="h-4 w-4 ml-2" />}
      </Button>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
