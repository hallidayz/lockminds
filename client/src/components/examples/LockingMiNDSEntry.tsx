import LockingMiNDSEntry from '../LockingMiNDSEntry';

const sampleLoginEntry = {
  id: "1",
  name: "GitHub",
  url: "https://github.com",
  username: "user@example.com",
  password: "SecurePassword123!",
  type: "login" as const,
  twoFA: "123456"
};

const samplePaymentEntry = {
  id: "2", 
  name: "My Credit Card",
  type: "payment" as const,
  cardNumber: "4532-1234-5678-9012",
  expiryDate: "12/26",
  cvv: "123"
};

export default function LockingMiNDSEntryExample() {
  return (
    <div className="space-y-4 p-4 max-w-md">
      <LockingMiNDSEntry 
        entry={sampleLoginEntry}
        onEdit={(id) => console.log('Edit entry:', id)}
        onDelete={(id) => console.log('Delete entry:', id)}
        onAutofill={(id) => console.log('Autofill entry:', id)}
      />
      
      <LockingMiNDSEntry 
        entry={samplePaymentEntry}
        onEdit={(id) => console.log('Edit entry:', id)}
        onDelete={(id) => console.log('Delete entry:', id)}
        onAutofill={(id) => console.log('Autofill entry:', id)}
      />
    </div>
  );
}