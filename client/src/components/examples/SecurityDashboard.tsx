import SecurityDashboard from '../SecurityDashboard';

//todo: remove mock functionality
const mockSecurityLogs = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 5000),
    message: "User authenticated with zero-knowledge proof",
    type: "success" as const
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 15000),
    message: "Quantum-resistant encryption initialized",
    type: "info" as const
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 25000),
    message: "Secure autofill initiated for GitHub",
    type: "success" as const
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 35000),
    message: "Clipboard cleared after 30 seconds",
    type: "info" as const
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 45000),
    message: "Anti-clickjacking protection enabled",
    type: "success" as const
  }
];

export default function SecurityDashboardExample() {
  return (
    <SecurityDashboard 
      encryptionStatus="active"
      clickjackingProtection={true}
      securityLogs={mockSecurityLogs}
      onRefresh={() => console.log('Refreshing security logs')}
      onToggleClickjackingProtection={(enabled) => console.log('Toggle clickjacking protection:', enabled)}
    />
  );
}