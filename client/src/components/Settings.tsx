import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings as SettingsIcon,
  HardDrive,
  Cloud,
  ChevronDown,
  Shield,
  Zap,
  Eye,
  Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProFeature from "./ProFeature";

interface SettingsProps {
  user: {
    email: string;
    userKey: string;
    zkProof: string;
    userId: string;
    accessToken: string;
    sessionId: string;
    masterPassword: string;
    accountType: 'free' | 'pro';
  };
}

export default function Settings({ user }: SettingsProps) {
  const { toast } = useToast();
  const [backupLocation, setBackupLocation] = useState<"local" | "online">("local");
  const [importFormat, setImportFormat] = useState<string>("");

  const handleBackupLocationChange = (location: "local" | "online") => {
    setBackupLocation(location);
    toast({
      title: "Backup Location Updated",
      description: `Backup location set to ${location === "local" ? "Local Storage" : "Online Drive"}`,
    });
  };

  const handleImportFormatChange = (format: string) => {
    setImportFormat(format);
    toast({
      title: "Import Format Updated",
      description: `Import format set to ${format}`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="settings-container">
      <div className="flex items-center space-x-3 mb-6">
        <SettingsIcon className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-settings-title">Backup & Import</h1>
          <p className="text-muted-foreground" data-testid="text-settings-subtitle">
            Manage your vault backups and import options
          </p>
        </div>
      </div>

      {/* Choose Backup Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5" />
            <span>Choose Backup Location</span>
          </CardTitle>
          <CardDescription>
            Select where your encrypted vault backups will be stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={backupLocation === "local" ? "default" : "outline"}
              className={backupLocation === "local" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
              onClick={() => handleBackupLocationChange("local")}
              data-testid="button-backup-local"
            >
              <HardDrive className="h-4 w-4 mr-2" />
              Local Storage
            </Button>
            <Button
              variant={backupLocation === "online" ? "default" : "outline"}
              className={backupLocation === "online" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
              onClick={() => handleBackupLocationChange("online")}
              data-testid="button-backup-online"
            >
              <Cloud className="h-4 w-4 mr-2" />
              Online Drive
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Your vault data is always encrypted before leaving your device.
          </p>
        </CardContent>
      </Card>

      {/* Universal Import File Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChevronDown className="h-5 w-5" />
            <span>Universal Import File Format</span>
          </CardTitle>
          <CardDescription>
            Select the file format for importing vault data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={handleImportFormatChange} value={importFormat}>
            <SelectTrigger className="w-full" data-testid="select-import-format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="universal">Universal Format (.zip, .csv, .json)</SelectItem>
              <SelectItem value="csv">CSV Format (.csv)</SelectItem>
              <SelectItem value="json">JSON Format (.json)</SelectItem>
              <SelectItem value="zip">ZIP Archive (.zip)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Ensure your import file matches the selected format for successful data migration.
          </p>
        </CardContent>
      </Card>

      {/* Pro Features */}
      <ProFeature 
        featureName="Quantum-Resistant Encryption"
        description="Advanced lattice-based encryption alongside AES-256 for future-proof security"
        userAccountType={user.accountType}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Quantum-Resistant Encryption</span>
            </CardTitle>
            <CardDescription>
              Post-quantum cryptography ready for the future
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="font-medium text-sm">AES-256-GCM</div>
                <div className="text-xs text-muted-foreground">Current standard</div>
              </div>
              <div className="p-3 border rounded-lg bg-blue-50">
                <div className="font-medium text-sm text-blue-800">Lattice-Based</div>
                <div className="text-xs text-blue-600">Quantum-resistant</div>
              </div>
            </div>
            <Button className="w-full" variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Enable Quantum Mode
            </Button>
          </CardContent>
        </Card>
      </ProFeature>

      <ProFeature 
        featureName="Real-Time Threat Detection"
        description="Advanced security monitoring with anti-clickjacking and threat detection"
        userAccountType={user.accountType}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-red-600" />
              <span>Real-Time Threat Detection</span>
            </CardTitle>
            <CardDescription>
              Monitor and block suspicious activities automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Anti-Clickjacking</span>
                <Button size="sm" variant="outline">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Suspicious Overlay Detection</span>
                <Button size="sm" variant="outline">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Autofill Protection</span>
                <Button size="sm" variant="outline">Enable</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </ProFeature>

      <ProFeature 
        featureName="Push Notifications"
        description="Real-time security alerts and notifications across all devices"
        userAccountType={user.accountType}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-green-600" />
              <span>Security Notifications</span>
            </CardTitle>
            <CardDescription>
              Stay informed about security events in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Login Alerts</span>
                <Button size="sm" variant="outline">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Suspicious Activity</span>
                <Button size="sm" variant="outline">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Clipboard Operations</span>
                <Button size="sm" variant="outline">Enable</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </ProFeature>
    </div>
  );
}