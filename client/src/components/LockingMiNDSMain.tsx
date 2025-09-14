import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import LockingMiNDSSidebar from "./LockingMiNDSSidebar";
import LockingMiNDSEntry from "./LockingMiNDSEntry";
import AddEntryForm from "./AddEntryForm";
import SecurityDashboard from "./SecurityDashboard";
import Settings from "./Settings";
import ShareExport from "./ShareExport";
import { Settings as SettingsIcon, Shield, Plus, Grid3X3, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  EncryptedVaultEntry, 
  VaultEntryData, 
  createEncryptedVaultEntry,
  getDecryptedVaultEntry 
} from "@/lib/encryption";

// Use encrypted vault entries for zero-trust architecture
type DecryptedVaultEntry = VaultEntryData & { id: string };

interface SecurityLog {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "warning" | "success" | "error";
}

interface LockingMiNDSMainProps {
  user: {
    email: string;
    userKey: string;
    zkProof: string;
    userId: string;
    accessToken: string;
    sessionId: string;
    masterPassword: string; // Use actual master password for PBKDF2 (zero-trust)
  };
  onLogout: () => void;
  encryptionStatus: string;
  clickjackingProtection: boolean;
  onToggleClickjackingProtection: (enabled: boolean) => void;
  onAutofill: (entryId: string) => void;
}

export default function LockingMiNDSMain({ 
  user, 
  onLogout, 
  encryptionStatus, 
  clickjackingProtection,
  onToggleClickjackingProtection,
  onAutofill 
}: LockingMiNDSMainProps) {
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddEntry, setShowAddEntry] = useState(false);

  // Encrypted vault entries - all sensitive data is encrypted client-side
  const [encryptedEntries, setEncryptedEntries] = useState<EncryptedVaultEntry[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Decrypted entries state (zero-trust: only in memory, never persisted as plaintext)
  const [entries, setEntries] = useState<DecryptedVaultEntry[]>([]);

  // Initialize with sample encrypted entries and decrypt them
  useEffect(() => {
    const initializeVault = async () => {
      try {
        setIsInitializing(true);
        
        // Create sample encrypted entries using FULL master password with PBKDF2
        const sampleEntries = await Promise.all([
          createEncryptedVaultEntry({
            name: "GitHub",
            url: "https://github.com",
            username: "user@example.com", 
            password: "SecurePassword123!",
            type: "login",
            twoFA: "123456"
          }, user.masterPassword, user.email, "1"),
          createEncryptedVaultEntry({
            name: "Gmail",
            url: "https://gmail.com",
            username: "user@gmail.com",
            password: "AnotherSecurePass456!",
            type: "login"
          }, user.masterPassword, user.email, "2"),
          createEncryptedVaultEntry({
            name: "Personal Credit Card",
            cardNumber: "4532-1234-5678-9012",
            expiryDate: "12/26",
            cvv: "123",
            cardholderName: "John Doe",
            type: "payment"
          }, user.masterPassword, user.email, "3"),
          createEncryptedVaultEntry({
            name: "Business Debit",
            cardNumber: "5555-4444-3333-2222",
            expiryDate: "08/27",
            cvv: "456",
            cardholderName: "Jane Smith",
            type: "payment"
          }, user.masterPassword, user.email, "4")
        ]);

        setEncryptedEntries(sampleEntries);
        await decryptAllEntries(sampleEntries);
      } catch (error) {
        console.error('Failed to initialize vault:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeVault();
  }, [user.masterPassword, user.email]);

  // Decrypt all entries when encrypted entries change
  useEffect(() => {
    if (!isInitializing) {
      decryptAllEntries(encryptedEntries);
    }
  }, [encryptedEntries, user.masterPassword, user.email, isInitializing]);

  // Function to decrypt all entries
  const decryptAllEntries = async (encryptedEntriesList: EncryptedVaultEntry[]) => {
    try {
      const decryptedEntries = await Promise.all(
        encryptedEntriesList.map(async (encrypted) => {
          const decrypted = await getDecryptedVaultEntry(encrypted, user.masterPassword, user.email);
          return decrypted;
        })
      );
      
      setEntries(decryptedEntries.filter(Boolean) as DecryptedVaultEntry[]);
    } catch (error) {
      console.error('Failed to decrypt entries:', error);
      setEntries([]);
    }
  };

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([
    {
      id: "1",
      timestamp: new Date(Date.now() - 5000),
      message: "User authenticated with zero-knowledge proof",
      type: "success"
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 15000),
      message: "Quantum-resistant encryption initialized",
      type: "info"
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 25000),
      message: "Secure autofill initiated for GitHub",
      type: "success"
    }
  ]);

  // Filter entries based on active view and search query
  const filteredEntries = useMemo(() => {
    let filtered = entries;

    // Filter by type
    if (activeView === "logins") {
      filtered = filtered.filter(entry => entry.type === "login");
    } else if (activeView === "payments") {
      filtered = filtered.filter(entry => entry.type === "payment");
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.url?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [entries, activeView, searchQuery]);

  const entryCount = useMemo(() => ({
    total: entries.length,
    login: entries.filter(e => e.type === "login").length,
    payment: entries.filter(e => e.type === "payment").length
  }), [entries]);

  const handleAddEntry = async (newEntry: VaultEntryData) => {
    try {
      // Zero-trust: encrypt before storage using FULL master password with PBKDF2
      const encryptedEntry = await createEncryptedVaultEntry(newEntry, user.masterPassword, user.email);
      setEncryptedEntries(prev => [...prev, encryptedEntry]);
      setShowAddEntry(false);
      
      // Add security log
      const log: SecurityLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `New ${newEntry.type} entry "${newEntry.name}" added to vault (encrypted)`,
        type: "success"
      };
      setSecurityLogs(prev => [log, ...prev.slice(0, 9)]);
      console.log('Added new encrypted entry:', { type: newEntry.type, name: newEntry.name });
    } catch (error) {
      console.error('Failed to add encrypted entry:', error);
      
      // Add error log
      const log: SecurityLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `Failed to add vault entry: encryption error`,
        type: "error"
      };
      setSecurityLogs(prev => [log, ...prev.slice(0, 9)]);
    }
  };

  const handleEditEntry = (entryId: string) => {
    console.log('Edit entry:', entryId);
    // todo: Implement edit functionality
  };

  const handleDeleteEntry = (entryId: string) => {
    // Remove from encrypted storage
    setEncryptedEntries(prev => prev.filter(e => e.id !== entryId));
    console.log('Deleted encrypted entry:', entryId);
    
    // Add security log
    const log: SecurityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `Vault entry deleted (secure deletion)`,
      type: "info"
    };
    setSecurityLogs(prev => [log, ...prev.slice(0, 9)]);
  };

  const handleAutofillEntry = (entryId: string) => {
    onAutofill(entryId);
    
    // Add security log
    const entry = entries.find(e => e.id === entryId);
    const log: SecurityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `Secure autofill initiated for ${entry?.name}`,
      type: "success"
    };
    setSecurityLogs(prev => [log, ...prev.slice(0, 9)]);
  };

  const getViewTitle = () => {
    switch (activeView) {
      case "logins": return "Login Credentials";
      case "payments": return "Payment Cards";
      case "security": return "Security Dashboard";
      case "settings": return "Settings";
      default: return "All Vault Items";
    }
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <LockingMiNDSSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          onAddEntry={() => setShowAddEntry(true)}
          onLogout={onLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          entryCount={entryCount}
        />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between p-3 sm:p-4 border-b bg-background">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold truncate" data-testid="text-view-title">
                  {getViewTitle()}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate" data-testid="text-user-email">
                  {user.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              <ThemeToggle />
              {activeView !== "security" && activeView !== "settings" && (
                <>
                  <Badge variant="outline" data-testid="badge-entry-count" className="hidden sm:inline-flex">
                    {filteredEntries.length} items
                  </Badge>
                  <Button 
                    onClick={() => setShowAddEntry(true)}
                    data-testid="button-add-entry-header"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Add Entry</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </>
              )}
              <Button 
                onClick={onLogout}
                variant="outline"
                size="sm"
                data-testid="button-logout-header"
                className="text-xs sm:text-sm"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-6">
            {/* Vault Entries Grid */}
            {(activeView === "all" || activeView === "logins" || activeView === "payments") && (
              <div className="space-y-3 sm:space-y-4">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <Grid3X3 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">No entries found</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      {searchQuery 
                        ? "Try adjusting your search terms"
                        : "Get started by adding your first vault entry"
                      }
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowAddEntry(true)} size="sm" className="sm:size-default">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Entry
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredEntries.map((entry) => (
                      <LockingMiNDSEntry
                        key={entry.id}
                        entry={entry}
                        onEdit={handleEditEntry}
                        onDelete={handleDeleteEntry}
                        onAutofill={handleAutofillEntry}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Dashboard */}
            {activeView === "security" && (
              <SecurityDashboard
                encryptionStatus={encryptionStatus}
                clickjackingProtection={clickjackingProtection}
                securityLogs={securityLogs}
                onRefresh={() => console.log('Refreshing security logs')}
                onToggleClickjackingProtection={onToggleClickjackingProtection}
              />
            )}

            {/* Settings */}
            {activeView === "settings" && (
              <Settings user={user} />
            )}

            {/* Share & Export */}
            {activeView === "share-export" && (
              <ShareExport user={user} />
            )}
          </main>
        </div>

        {/* Add Entry Modal */}
        {showAddEntry && (
          <AddEntryForm
            onSave={handleAddEntry}
            onCancel={() => setShowAddEntry(false)}
          />
        )}
      </div>
    </SidebarProvider>
  );
}