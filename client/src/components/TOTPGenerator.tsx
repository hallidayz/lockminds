import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus,
  Trash2,
  Copy,
  Clock,
  Shield,
  User,
  Mail,
  Key,
  QrCode,
  Eye,
  EyeOff,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TOTPGenerator, TOTPEntry, TOTPCode } from "@/lib/totp";

interface TOTPGeneratorProps {
  user: {
    email: string;
    userKey: string;
    zkProof: string;
    userId: string;
    accessToken: string;
    sessionId: string;
    masterPassword: string;
  };
}

export default function TOTPGeneratorComponent({ user }: TOTPGeneratorProps) {
  const { toast } = useToast();
  const [totpEntries, setTotpEntries] = useState<TOTPEntry[]>([]);
  const [totpCodes, setTotpCodes] = useState<Record<string, TOTPCode>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntry, setNewEntry] = useState({
    accountName: '',
    email: '',
    secret: '',
    issuer: '',
    algorithm: 'SHA1' as 'SHA1' | 'SHA256' | 'SHA512',
    digits: 6 as 6 | 8,
    period: 30
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Load TOTP entries from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem(`totp_entries_${user.userId}`);
    if (savedEntries) {
      try {
        const entries = JSON.parse(savedEntries).map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }));
        setTotpEntries(entries);
      } catch (error) {
        console.error('Failed to load TOTP entries:', error);
      }
    }
  }, [user.userId]);

  // Update TOTP codes every second
  useEffect(() => {
    const updateCodes = async () => {
      const newCodes: Record<string, TOTPCode> = {};
      for (const entry of totpEntries) {
        try {
          newCodes[entry.id] = await TOTPGenerator.generateTOTP(entry);
        } catch (error) {
          console.error(`Failed to generate TOTP for ${entry.accountName}:`, error);
        }
      }
      setTotpCodes(newCodes);
    };

    updateCodes();
    const interval = setInterval(updateCodes, 1000);
    return () => clearInterval(interval);
  }, [totpEntries]);

  // Save TOTP entries to localStorage
  const saveEntries = useCallback((entries: TOTPEntry[]) => {
    localStorage.setItem(`totp_entries_${user.userId}`, JSON.stringify(entries));
  }, [user.userId]);

  // Add new TOTP entry
  const handleAddEntry = () => {
    if (!newEntry.accountName || !newEntry.email || !newEntry.secret) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const entry: TOTPEntry = {
      id: Date.now().toString(),
      accountName: newEntry.accountName,
      email: newEntry.email,
      secret: newEntry.secret,
      issuer: newEntry.issuer || undefined,
      algorithm: newEntry.algorithm,
      digits: newEntry.digits,
      period: newEntry.period,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedEntries = [...totpEntries, entry];
    setTotpEntries(updatedEntries);
    saveEntries(updatedEntries);

    // Reset form
    setNewEntry({
      accountName: '',
      email: '',
      secret: '',
      issuer: '',
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    });
    setShowAddDialog(false);

    toast({
      title: "TOTP Entry Added",
      description: `${entry.accountName} has been added to your MFA generator`,
    });
  };

  // Remove TOTP entry
  const handleRemoveEntry = (id: string) => {
    const entry = totpEntries.find(e => e.id === id);
    const updatedEntries = totpEntries.filter(e => e.id !== id);
    setTotpEntries(updatedEntries);
    saveEntries(updatedEntries);

    toast({
      title: "TOTP Entry Removed",
      description: entry ? `${entry.accountName} has been removed` : "Entry removed",
    });
  };

  // Copy TOTP code to clipboard
  const handleCopyCode = async (code: string) => {
    try {
      const cleanCode = code.replace(/\s/g, '');
      await navigator.clipboard.writeText(cleanCode);
      toast({
        title: "Code Copied",
        description: "TOTP code copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  // Generate new secret
  const handleGenerateSecret = () => {
    const secret = TOTPGenerator.generateSecret();
    setNewEntry(prev => ({ ...prev, secret }));
  };

  // Toggle secret visibility
  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Generate QR code URL
  const getQRCodeURL = (entry: TOTPEntry) => {
    return TOTPGenerator.generateQRCodeURL(entry);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4" data-testid="totp-generator-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
            <XCircle className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">TOTP MFA Generator</h1>
            <div className="w-16 h-0.5 bg-gray-300"></div>
          </div>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          variant="outline"
          className="border-black text-black hover:bg-gray-50"
          data-testid="button-add-entry"
        >
          Add Entry
        </Button>
      </div>

      {/* TOTP Entries */}
      <div className="space-y-4">
        {totpEntries.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No TOTP Entries</h3>
              <p className="text-gray-600 mb-4">Add your first TOTP entry to start generating MFA codes</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          totpEntries.map((entry) => {
            const code = totpCodes[entry.id];
            const showSecret = showSecrets[entry.id];

            return (
              <Card key={entry.id} className="border-gray-200 rounded-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <XCircle className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{entry.accountName}</h3>
                        <p className="text-sm text-gray-600">{entry.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {code && (
                        <div className="text-right">
                          <div className="text-2xl font-mono font-bold text-gray-900 mb-1">
                            {code.code}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                              <XCircle className="h-2 w-2 text-gray-500" />
                            </div>
                            <span className="font-mono">{code.timeRemaining}s</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => code && handleCopyCode(code.code)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                          data-testid={`button-copy-${entry.id}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleRemoveEntry(entry.id)}
                          variant="outline"
                          size="sm"
                          className="border-black text-black hover:bg-gray-50"
                          data-testid={`button-remove-${entry.id}`}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  {code && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-orange-500 h-1 rounded-full transition-all duration-1000"
                          style={{ width: `${code.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add TOTP Entry</DialogTitle>
            <DialogDescription>
              Add a new TOTP entry for two-factor authentication
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={newEntry.accountName}
                onChange={(e) => setNewEntry(prev => ({ ...prev, accountName: e.target.value }))}
                placeholder="e.g., Google, GitHub, Microsoft"
                data-testid="input-account-name"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newEntry.email}
                onChange={(e) => setNewEntry(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
                data-testid="input-email"
              />
            </div>
            
            <div>
              <Label htmlFor="secret">Secret Key</Label>
              <div className="flex space-x-2">
                <Input
                  id="secret"
                  type={showSecrets['new'] ? 'text' : 'password'}
                  value={newEntry.secret}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, secret: e.target.value }))}
                  placeholder="Enter or generate secret key"
                  data-testid="input-secret"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleSecretVisibility('new')}
                  data-testid="button-toggle-secret"
                >
                  {showSecrets['new'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateSecret}
                  data-testid="button-generate-secret"
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="issuer">Issuer (Optional)</Label>
              <Input
                id="issuer"
                value={newEntry.issuer}
                onChange={(e) => setNewEntry(prev => ({ ...prev, issuer: e.target.value }))}
                placeholder="e.g., Google, Microsoft"
                data-testid="input-issuer"
              />
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="algorithm">Algorithm</Label>
                <select
                  id="algorithm"
                  value={newEntry.algorithm}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, algorithm: e.target.value as 'SHA1' | 'SHA256' | 'SHA512' }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  data-testid="select-algorithm"
                >
                  <option value="SHA1">SHA1</option>
                  <option value="SHA256">SHA256</option>
                  <option value="SHA512">SHA512</option>
                </select>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="digits">Digits</Label>
                <select
                  id="digits"
                  value={newEntry.digits}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, digits: parseInt(e.target.value) as 6 | 8 }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  data-testid="select-digits"
                >
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleAddEntry}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="button-add-entry-confirm"
              >
                Add Entry
              </Button>
              <Button
                onClick={() => setShowAddDialog(false)}
                variant="outline"
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Notice */}
      <div className="flex items-center space-x-2 text-sm text-blue-600">
        <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
          <XCircle className="h-2 w-2 text-gray-500" />
        </div>
        <span>Your codes are securely generated and never leave your device.</span>
      </div>
    </div>
  );
}
