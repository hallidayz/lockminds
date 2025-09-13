import VaultMain from '../VaultMain';

//todo: remove mock functionality
const mockUser = {
  email: "user@example.com",
  userKey: "abc123key",
  zkProof: "zkproof456"
};

export default function VaultMainExample() {
  return (
    <VaultMain 
      user={mockUser}
      onLogout={() => console.log('Logout triggered')}
      encryptionStatus="active"
      clickjackingProtection={true}
      onToggleClickjackingProtection={(enabled) => console.log('Toggle clickjacking:', enabled)}
      onAutofill={(entryId) => console.log('Autofill entry:', entryId)}
    />
  );
}