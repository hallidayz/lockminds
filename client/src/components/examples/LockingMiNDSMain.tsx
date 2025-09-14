import LockingMiNDSMain from '../LockingMiNDSMain';

//todo: remove mock functionality
const mockUser = {
  email: "user@example.com",
  userKey: "abc123key",
  zkProof: "zkproof456",
  userId: "mock-user-id",
  accessToken: "mock-access-token",
  sessionId: "mock-session-id",
  masterPassword: "mockPassword123"
};

export default function LockingMiNDSMainExample() {
  return (
    <LockingMiNDSMain 
      user={mockUser}
      onLogout={() => console.log('Logout triggered')}
      encryptionStatus="active"
      clickjackingProtection={true}
      onToggleClickjackingProtection={(enabled) => console.log('Toggle clickjacking:', enabled)}
      onAutofill={(entryId) => console.log('Autofill entry:', entryId)}
    />
  );
}