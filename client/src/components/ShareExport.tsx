import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Share2,
  Cloud,
  HardDrive,
  Smartphone,
  Download,
  X,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareExportProps {
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

interface CloudService {
  id: string;
  name: string;
  icon: any;
  status: "active" | "disabled";
  description: string;
}

export default function ShareExport({ user }: ShareExportProps) {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<string>("universal");
  const [isExporting, setIsExporting] = useState(false);

  // Cloud services matching the wireframe
  const cloudServices: CloudService[] = [
    {
      id: "onedrive",
      name: "OneDrive",
      icon: Cloud,
      status: "disabled",
      description: "Microsoft OneDrive"
    },
    {
      id: "icloud",
      name: "iCloud",
      icon: Cloud,
      status: "disabled", 
      description: "Apple iCloud"
    },
    {
      id: "google-drive",
      name: "Google Drive",
      icon: Cloud,
      status: "active",
      description: "Google Drive"
    }
  ];

  // Local/Direct options matching the wireframe
  const localOptions: CloudService[] = [
    {
      id: "device-to-device",
      name: "Device-to-Device",
      icon: Smartphone,
      status: "active",
      description: "Transfer between devices"
    },
    {
      id: "local-export",
      name: "Local Export",
      icon: Download,
      status: "disabled",
      description: "Download to device"
    }
  ];

  const fileFormats = [
    { value: "universal", label: "Universal Format (.zip, .csv, .json)" },
    { value: "csv", label: "CSV Format (.csv)" },
    { value: "json", label: "JSON Format (.json)" },
    { value: "zip", label: "ZIP Archive (.zip)" }
  ];

  const handleServiceClick = async (service: CloudService) => {
    if (service.status === "disabled") {
      toast({
        title: "Service Unavailable",
        description: `${service.name} integration is not yet available`,
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Export Successful",
        description: `Vault exported to ${service.name} in ${selectedFormat} format`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export to ${service.name}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getServiceButton = (service: CloudService) => {
    const isDisabled = service.status === "disabled" || isExporting;
    
    return (
      <Button
        key={service.id}
        onClick={() => handleServiceClick(service)}
        disabled={isDisabled}
        className={`w-full h-12 ${
          service.status === "active" 
            ? "bg-orange-500 hover:bg-orange-600 text-white" 
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
        data-testid={`button-${service.id}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <service.icon className="h-5 w-5" />
            <span className="font-medium">{service.name}</span>
          </div>
          {service.status === "disabled" && (
            <X className="h-4 w-4" />
          )}
          {service.status === "active" && !isExporting && (
            <Check className="h-4 w-4" />
          )}
        </div>
      </Button>
    );
  };

  return (
    <div className="max-w-md mx-auto space-y-6 p-4" data-testid="share-export-container">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-lg">
        <h1 className="text-xl font-bold text-center">Share & Export</h1>
      </div>

      {/* Cloud Services Section */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Cloud Services</Label>
        <div className="grid grid-cols-3 gap-2">
          {cloudServices.map(service => getServiceButton(service))}
        </div>
      </div>

      {/* Local/Direct Options Section */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Local/Direct Options</Label>
        <div className="grid grid-cols-2 gap-2">
          {localOptions.map(service => getServiceButton(service))}
        </div>
      </div>

      {/* File Format Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Select File Format</Label>
        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {fileFormats.map((format) => (
              <SelectItem key={format.value} value={format.value}>
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Export Status */}
      {isExporting && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              <span className="text-sm text-muted-foreground">Exporting vault data...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
