import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import VaultSidebar from "./VaultSidebar";
import VaultEntry from "./VaultEntry";
import AddEntryForm from "./AddEntryForm";
import SecurityDashboard from "./SecurityDashboard";
import Settings from "./Settings";
import { Settings as SettingsIcon, Shield, Plus, Grid3X3 } from "lucide-react";

interface VaultEntry {
  id: string;
  name: string;
  url?: string;
  username?: string;
  password?: string;
  type: "login" | "payment";
  twoFA?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
}

interface SecurityLog {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "warning" | "success" | "error";
}

interface VaultMainProps {
  user: {
    email: string;
    userKey: string;
    zkProof: string;
  };
  onLogout: () => void;
  encryptionStatus: string;
  clickjackingProtection: boolean;
  onToggleClickjackingProtection: (enabled: boolean) => void;
  onAutofill: (entryId: string) => void;
}

export default function VaultMain({ 
  user, 
  onLogout, 
  encryptionStatus, 
  clickjackingProtection,
  onToggleClickjackingProtection,
  onAutofill 
}: VaultMainProps) {
  const [activeView, setActiveView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddEntry, setShowAddEntry] = useState(false);

  //todo: remove mock functionality
  const [entries, setEntries] = useState<VaultEntry[]>([
    {
      id: "1",
      name: "GitHub",
      url: "https://github.com",
      username: "user@example.com",
      password: "SecurePassword123!",
      type: "login",
      twoFA: "123456"
    },
    {
      id: "2",
      name: "Gmail",
      url: "https://gmail.com",
      username: "user@gmail.com",
      password: "AnotherSecurePass456!",
      type: "login"
    },
    {
      id: "3",
      name: "Personal Credit Card",
      type: "payment",
      cardNumber: "4532-1234-5678-9012",
      expiryDate: "12/26",
      cvv: "123"
    },
    {
      id: "4",
      name: "Business Debit",
      type: "payment",
      cardNumber: "5555-4444-3333-2222",
      expiryDate: "08/27",
      cvv: "456"
    }
  ]);

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

  const handleAddEntry = (newEntry: any) => {
    setEntries(prev => [...prev, newEntry]);
    setShowAddEntry(false);
    
    // Add security log
    const log: SecurityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `New ${newEntry.type} entry "${newEntry.name}" added to vault`,
      type: "success"
    };
    setSecurityLogs(prev => [log, ...prev.slice(0, 9)]);
    console.log('Added new entry:', newEntry);
  };

  const handleEditEntry = (entryId: string) => {
    console.log('Edit entry:', entryId);
    // todo: Implement edit functionality
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    console.log('Deleted entry:', entryId);
    
    // Add security log
    const log: SecurityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `Vault entry deleted`,
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
      <div className="flex h-screen w-full bg-background">
        <VaultSidebar
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
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center space-x-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-xl font-semibold" data-testid="text-view-title">
                  {getViewTitle()}
                </h1>
                <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                  {user.email}
                </p>
              </div>
            </div>
            
            {activeView !== "security" && activeView !== "settings" && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" data-testid="badge-entry-count">
                  {filteredEntries.length} items
                </Badge>
                <Button 
                  onClick={() => setShowAddEntry(true)}
                  data-testid="button-add-entry-header"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </div>
            )}
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* Vault Entries Grid */}
            {(activeView === "all" || activeView === "logins" || activeView === "payments") && (
              <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No entries found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? "Try adjusting your search terms"
                        : "Get started by adding your first vault entry"
                      }
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowAddEntry(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Entry
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredEntries.map((entry) => (
                      <VaultEntry
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