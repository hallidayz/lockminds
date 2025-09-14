# Payment Integration Guide

This document explains how to integrate a payment processor with the LockingMiNDS payment UI.

## Components Created

### 1. PaymentModal Component
- **Location**: `client/src/components/PaymentModal.tsx`
- **Purpose**: Main payment interface with plan selection and payment form
- **Features**:
  - Monthly/Yearly plan selection
  - Multiple payment methods (Card, PayPal, Apple Pay, Google Pay)
  - Card form with validation
  - Order summary
  - Security notices

### 2. ProFeature Component
- **Location**: `client/src/components/ProFeature.tsx`
- **Purpose**: Wraps pro-only features with upgrade prompts
- **Features**:
  - Shows feature content for pro users
  - Shows upgrade prompt for free users
  - Integrates with PaymentModal

### 3. UpgradeButton Component
- **Location**: `client/src/components/UpgradeButton.tsx`
- **Purpose**: Reusable upgrade button component
- **Features**:
  - Customizable styling
  - Integrates with PaymentModal
  - Used in sidebar and other locations

## Integration Points

### 1. Payment Processing
In `PaymentModal.tsx`, replace the mock payment processing in the `handlePayment` function:

```typescript
const handlePayment = async () => {
  setIsProcessing(true);
  
  try {
    // Replace this with your payment processor integration
    const paymentData: PaymentData = {
      ...formData,
      plan: selectedPlan,
      paymentMethod
    };
    
    // Example integration points:
    // - Stripe: await stripe.confirmPayment(...)
    // - PayPal: await paypal.orders.create(...)
    // - Square: await square.paymentsApi.createPayment(...)
    
    // After successful payment:
    onPaymentSuccess?.(paymentData);
    onClose();
    
  } catch (error) {
    // Handle payment errors
    toast({
      title: "Payment Failed",
      description: "There was an error processing your payment. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsProcessing(false);
  }
};
```

### 2. Account Upgrade
After successful payment, update the user's account type:

```typescript
const handlePaymentSuccess = (paymentData: any) => {
  // Update user account type to 'pro'
  // This could be done via:
  // 1. API call to update user account
  // 2. Local state update
  // 3. Page refresh
  
  // Example API call:
  // await updateUserAccount({ accountType: 'pro' });
  
  setShowPaymentModal(false);
};
```

### 3. Server-Side Integration
Update the server to handle payment webhooks and account upgrades:

```typescript
// Example webhook endpoint
app.post('/api/webhooks/payment', (req, res) => {
  // Verify webhook signature
  // Process payment event
  // Update user account type
  // Send confirmation email
});
```

## Payment Data Structure

```typescript
interface PaymentData {
  plan: 'monthly' | 'yearly';
  paymentMethod: 'card' | 'paypal' | 'apple' | 'google';
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  name?: string;
  email?: string;
}
```

## Pricing Configuration

Update pricing in `PaymentModal.tsx`:

```typescript
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
```

## Security Considerations

1. **Never store payment details** - Use your payment processor's secure storage
2. **Validate on server-side** - Always verify payments server-side
3. **Use HTTPS** - Ensure all payment communications are encrypted
4. **PCI Compliance** - Follow PCI DSS guidelines for card handling
5. **Webhook Security** - Verify webhook signatures from payment processors

## Testing

1. Use your payment processor's test mode
2. Test all payment methods
3. Test both success and failure scenarios
4. Verify account upgrades work correctly
5. Test webhook handling

## Example Integrations

### Stripe
```bash
npm install @stripe/stripe-js stripe
```

### PayPal
```bash
npm install @paypal/react-paypal-js
```

### Square
```bash
npm install squareup
```

## Support

For questions about payment integration, refer to your chosen payment processor's documentation or contact the development team.
