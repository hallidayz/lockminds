import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Zap,
  Eye,
  RefreshCw
} from "lucide-react";

interface SecurityLog {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "warning" | "success" | "error";
}

interface SecurityDashboardProps {
  encryptionStatus: string;
  clickjackingProtection: boolean;
  securityLogs: SecurityLog[];
  onRefresh?: () => void;
  onToggleClickjackingProtection?: (enabled: boolean) => void;
}

export default function SecurityDashboard({ 
  encryptionStatus, 
  clickjackingProtection, 
  securityLogs,
  onRefresh,
  onToggleClickjackingProtection
}: SecurityDashboardProps) {
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "initializing": return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Eye className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Encryption Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encryption</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(encryptionStatus)}
              <span className="text-lg font-semibold capitalize" data-testid="text-encryption-status">
                {encryptionStatus}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Quantum-resistant encryption
            </p>
          </CardContent>
        </Card>

        {/* Clickjacking Protection */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anti-Clickjacking</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {clickjackingProtection ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-lg font-semibold" data-testid="text-clickjacking-status">
                  {clickjackingProtection ? "Active" : "Disabled"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleClickjackingProtection?.(!clickjackingProtection)}
                data-testid="button-toggle-clickjacking"
              >
                {clickjackingProtection ? "Disable" : "Enable"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time threat detection
            </p>
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-lg font-semibold">Secure</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Zero-knowledge authentication
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Activity Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Security Activity</span>
            </CardTitle>
            <CardDescription>
              Real-time monitoring and threat detection logs
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            data-testid="button-refresh-logs"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            RefreshCw
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full">
            <div className="space-y-2">
              {securityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No security events to display</p>
                </div>
              ) : (
                securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover-elevate"
                    data-testid={`log-entry-${log.id}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{log.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            log.type === "success" 
                              ? "border-green-500/20 text-green-600 dark:text-green-400"
                              : log.type === "warning"
                              ? "border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                              : log.type === "error"
                              ? "border-red-500/20 text-red-600 dark:text-red-400"
                              : "border-blue-500/20 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {log.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatTime(log.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}