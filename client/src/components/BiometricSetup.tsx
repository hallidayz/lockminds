import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Fingerprint,
  Monitor,
  Apple,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BiometricRegistration } from "@/lib/biometricRegistration";
import { PlatformDetection, PlatformInfo } from "@/lib/platformDetection";

interface BiometricSetupProps {
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

interface BiometricOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  platform: string;
  status: "available" | "unavailable" | "enabled" | "error";
  requirements: string;
  minVersion?: string;
}

export default function BiometricSetup({ user }: BiometricSetupProps) {
  const { toast } = useToast();
  const [isSettingUp, setIsSettingUp] = useState<string | null>(null);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<Record<string, 'available' | 'unavailable' | 'enabled' | 'error'>>({});

  // Detect user's platform and capabilities
  useEffect(() => {
    const detectPlatform = async () => {
      const info = PlatformDetection.detectPlatform();
      setPlatformInfo(info);
      
      // Check which biometric options are available
      const available = BiometricRegistration.getAvailableOptions();
      const status: Record<string, 'available' | 'unavailable' | 'enabled' | 'error'> = {};
      
      // Set status for each option
      biometricOptions.forEach(option => {
        if (available.includes(option.id)) {
          status[option.id] = 'available';
        } else {
          status[option.id] = 'unavailable';
        }
      });
      
      setBiometricStatus(status);
    };

    detectPlatform();
  }, []);

  // Biometric options matching the wireframe
  const biometricOptions: BiometricOption[] = [
    {
      id: "windows-hello",
      name: "Windows Hello",
      description: "Face, fingerprint, or PIN (Windows 10+)",
      icon: Monitor,
      platform: "windows",
      status: platformInfo?.os === "windows" ? "available" : "unavailable",
      requirements: "Windows 10 or later",
      minVersion: "10.0"
    },
    {
      id: "macos-touchid",
      name: "macOS Touch ID",
      description: "Touch ID sensor (macOS 10.12+)",
      icon: Apple,
      platform: "macos",
      status: platformInfo?.os === "macos" ? "available" : "unavailable",
      requirements: "macOS 10.12 or later with Touch ID",
      minVersion: "10.12"
    },
    {
      id: "linux-fprint",
      name: "Linux fprint / YubiKey",
      description: "Fingerprint or security key (Linux)",
      icon: Shield,
      platform: "linux",
      status: platformInfo?.os === "linux" ? "available" : "unavailable",
      requirements: "Linux with fprintd or YubiKey support"
    }
  ];

  const handleEnableBiometric = async (option: BiometricOption) => {
    const currentStatus = biometricStatus[option.id];
    
    if (currentStatus === "unavailable") {
      toast({
        title: "Not Available",
        description: `${option.name} is not available on your current platform`,
        variant: "destructive",
      });
      return;
    }

    setIsSettingUp(option.id);

    try {
      // Register biometric credential
      const result = await BiometricRegistration.registerBiometric(
        user.userId,
        user.email,
        option.id
      );

      if (result.success) {
        // Update status to enabled
        setBiometricStatus(prev => ({
          ...prev,
          [option.id]: 'enabled'
        }));

        toast({
          title: "Biometric Setup Successful",
          description: `${option.name} has been enabled for LockingMiNDS`,
        });
      } else {
        throw new Error(result.error || 'Registration failed');
      }

    } catch (error) {
      console.error('Biometric setup failed:', error);
      
      // Update status to error
      setBiometricStatus(prev => ({
        ...prev,
        [option.id]: 'error'
      }));

      toast({
        title: "Setup Failed",
        description: `Failed to enable ${option.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSettingUp(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "enabled":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "unavailable":
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "enabled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "unavailable":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "enabled":
        return "Enabled";
      case "unavailable":
        return "Not Available";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 p-4" data-testid="biometric-setup-container">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
            <XCircle className="h-6 w-6 text-gray-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Set Up Biometric Unlock</h1>
        <div className="w-16 h-0.5 bg-gray-300 mx-auto"></div>
      </div>

      {/* Description */}
      <div className="text-center">
        <p className="text-gray-600 text-sm leading-relaxed">
          LockingMiNDS supports fast, secure unlock with your device's biometrics. 
          Choose your preferred method below to enable.
        </p>
      </div>

      {/* Biometric Options */}
      <div className="space-y-4">
        {biometricOptions.map((option) => {
          const currentStatus = biometricStatus[option.id] || 'unavailable';
          return (
            <Card key={option.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{option.name}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`text-xs ${getStatusColor(currentStatus)}`}
                      data-testid={`badge-status-${option.id}`}
                    >
                      {getStatusIcon(currentStatus)}
                      <span className="ml-1">{getStatusText(currentStatus)}</span>
                    </Badge>
                    <Button
                      onClick={() => handleEnableBiometric(option)}
                      disabled={currentStatus === "unavailable" || currentStatus === "enabled" || isSettingUp === option.id}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                      data-testid={`button-enable-${option.id}`}
                    >
                      {isSettingUp === option.id ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span>Setting up...</span>
                        </div>
                      ) : currentStatus === "enabled" ? (
                        "Enabled"
                      ) : (
                        "Enable"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Platform Detection Info */}
      {platformInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Detected Platform: <span className="font-semibold capitalize">{platformInfo.os}</span>
                {platformInfo.version !== '0.0.0' && (
                  <span className="ml-1">({platformInfo.version})</span>
                )}
              </span>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              <p>WebAuthn: {platformInfo.supportsWebAuthn ? '✅ Supported' : '❌ Not Supported'}</p>
              <p>Platform Authenticator: {platformInfo.supportsPlatformAuthenticator ? '✅ Available' : '❌ Not Available'}</p>
            </div>
            {platformInfo.os === "unknown" && (
              <p className="text-xs text-blue-600 mt-1">
                Platform detection failed. Some biometric options may not be available.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Need help? <a href="#" className="text-blue-600 hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  );
}
