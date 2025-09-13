import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Cloud, 
  Shield, 
  Smartphone, 
  Key, 
  Download, 
  Upload, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon,
  Lock,
  Globe,
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsProps {
  user: {
    email: string;
    userKey: string;
    zkProof: string;
  };
}

interface CloudConnection {
  id: string;
  name: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  icon: any;
}

interface VaultBackup {
  id: string;
  timestamp: string;
  size: string;
  location: string;
  encrypted: boolean;
}

export default function Settings({ user }: SettingsProps) {
  const { toast } = useToast();
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [encryptBackups, setEncryptBackups] = useState(true);
  
  // Mock cloud connections
  const [cloudConnections, setCloudConnections] = useState<CloudConnection[]>([
    {
      id: "dropbox",
      name: "Dropbox",
      provider: "dropbox",
      status: "disconnected",
      icon: Cloud
    },
    {
      id: "onedrive",
      name: "OneDrive",
      provider: "microsoft",
      status: "disconnected",
      icon: Cloud
    },
    {
      id: "replit-storage",
      name: "Replit Object Storage",
      provider: "replit",
      status: "connected",
      lastSync: "2025-09-13T16:30:00Z",
      icon: Database
    }
  ]);

  // Mock backup history
  const [backupHistory] = useState<VaultBackup[]>([
    {
      id: "1",
      timestamp: "2025-09-13T16:30:00Z",
      size: "2.3 MB",
      location: "Replit Storage",
      encrypted: true
    },
    {
      id: "2", 
      timestamp: "2025-09-12T16:30:00Z",
      size: "2.2 MB",
      location: "Replit Storage",
      encrypted: true
    }
  ]);

  const handleConnectCloud = async (connectionId: string) => {
    try {
      // Mock connection logic
      setCloudConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status: "connected", lastSync: new Date().toISOString() }
            : conn
        )
      );
      
      toast({
        title: "Connection successful",
        description: `Successfully connected to ${cloudConnections.find(c => c.id === connectionId)?.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to cloud storage",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectCloud = async (connectionId: string) => {
    try {
      setCloudConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, status: "disconnected", lastSync: undefined }
            : conn
        )
      );
      
      toast({
        title: "Disconnected",
        description: `Disconnected from ${cloudConnections.find(c => c.id === connectionId)?.name}`,
      });
    } catch (error) {
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect from cloud storage",
        variant: "destructive",
      });
    }
  };

  const handleManualBackup = async () => {
    try {
      toast({
        title: "Backup initiated",
        description: "Creating encrypted vault backup...",
      });
      
      // Mock backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Backup completed",
        description: "Vault backup created successfully",
      });
    } catch (error) {
      toast({
        title: "Backup failed",
        description: "Failed to create vault backup",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="settings-container">
      <div className="flex items-center space-x-3 mb-6">
        <SettingsIcon className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground" data-testid="text-settings-subtitle">
            Manage your vault settings and external connections
          </p>
        </div>
      </div>

      <Tabs defaultValue="backup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backup" data-testid="tab-backup">
            <Cloud className="h-4 w-4 mr-2" />
            Backup & Sync
          </TabsTrigger>
          <TabsTrigger value="connections" data-testid="tab-connections">
            <Globe className="h-4 w-4 mr-2" />
            Cloud Connections
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="devices" data-testid="tab-devices">
            <Smartphone className="h-4 w-4 mr-2" />
            Devices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backup" className="space-y-6">
          {/* Backup Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cloud className="h-5 w-5" />
                <span>Backup Settings</span>
              </CardTitle>
              <CardDescription>
                Configure automatic backup and sync settings for your encrypted vault
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Automatic Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup your vault to connected cloud storage
                  </p>
                </div>
                <Switch
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                  data-testid="switch-auto-backup"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base">Backup Frequency</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["hourly", "daily", "weekly"].map((frequency) => (
                    <Button
                      key={frequency}
                      variant={backupFrequency === frequency ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBackupFrequency(frequency)}
                      data-testid={`button-frequency-${frequency}`}
                      className="capitalize"
                    >
                      {frequency}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Encrypt Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Additional encryption layer for cloud backups (recommended)
                  </p>
                </div>
                <Switch
                  checked={encryptBackups}
                  onCheckedChange={setEncryptBackups}
                  data-testid="switch-encrypt-backups"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Manual Backup</h4>
                  <p className="text-sm text-muted-foreground">
                    Create an immediate backup of your vault
                  </p>
                </div>
                <Button 
                  onClick={handleManualBackup}
                  data-testid="button-manual-backup"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Backup Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>Recent vault backups and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backupHistory.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`backup-item-${backup.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">
                          {new Date(backup.timestamp).toLocaleDateString()} at{" "}
                          {new Date(backup.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {backup.size} • {backup.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {backup.encrypted && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Encrypted
                        </Badge>
                      )}
                      <Button variant="outline" size="sm" data-testid={`button-download-${backup.id}`}>
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cloud Storage Connections</CardTitle>
              <CardDescription>
                Connect external cloud storage services for vault backup and sync
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cloudConnections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`connection-item-${connection.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <connection.icon className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{connection.name}</h4>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(connection.status)}
                          <Badge 
                            className={`text-xs ${getStatusColor(connection.status)}`}
                            data-testid={`badge-status-${connection.id}`}
                          >
                            {connection.status}
                          </Badge>
                          {connection.lastSync && (
                            <span className="text-xs text-muted-foreground">
                              Last sync: {new Date(connection.lastSync).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {connection.status === "connected" ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid={`button-sync-${connection.id}`}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Sync
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDisconnectCloud(connection.id)}
                            data-testid={`button-disconnect-${connection.id}`}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => handleConnectCloud(connection.id)}
                          data-testid={`button-connect-${connection.id}`}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Advanced security configuration for your vault
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Zero-Knowledge Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Your vault is encrypted locally with your master key
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    <Lock className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base">Master Key</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-mono break-all">
                      {user.userKey.substring(0, 32)}...
                    </p>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-regenerate-key">
                    <Key className="h-3 w-3 mr-1" />
                    Regenerate Key
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base">Zero-Knowledge Proof</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-mono break-all">
                      {user.zkProof.substring(0, 32)}...
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>
                Manage devices that have access to your vault
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Device Management</h3>
                <p className="text-muted-foreground">
                  Device management features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}