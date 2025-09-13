import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  User, 
  Copy, 
  Eye, 
  EyeOff, 
  CreditCard, 
  Shield, 
  MoreVertical,
  CheckCircle2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VaultEntryProps {
  entry: {
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
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAutofill?: (id: string) => void;
}

export default function VaultEntry({ entry, onEdit, onDelete, onAutofill }: VaultEntryProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    console.log(`Copied ${type} to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const maskCardNumber = (cardNumber: string) => {
    return cardNumber.replace(/\d(?=\d{4})/g, "*");
  };

  const getStrengthColor = (password?: string) => {
    if (!password) return "bg-red-500/20 text-red-400";
    if (password.length < 8) return "bg-red-500/20 text-red-400";
    if (password.length < 12) return "bg-yellow-500/20 text-yellow-400";
    return "bg-green-500/20 text-green-400";
  };

  const getStrengthText = (password?: string) => {
    if (!password) return "None";
    if (password.length < 8) return "Weak";
    if (password.length < 12) return "Medium";
    return "Strong";
  };

  return (
    <Card className="hover-elevate transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            {entry.type === "payment" ? (
              <CreditCard className="h-5 w-5 text-primary" />
            ) : (
              <Globe className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-sm" data-testid={`text-entry-name-${entry.id}`}>
              {entry.name}
            </h3>
            {entry.url && (
              <p className="text-xs text-muted-foreground">{entry.url}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {entry.type === "login" && entry.password && (
            <Badge className={`text-xs ${getStrengthColor(entry.password)} border-0`}>
              {getStrengthText(entry.password)}
            </Badge>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                data-testid={`button-menu-${entry.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(entry.id)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete?.(entry.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Login Credentials */}
        {entry.type === "login" && (
          <>
            {entry.username && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono" data-testid={`text-username-${entry.id}`}>
                    {entry.username}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(entry.username!, 'username')}
                  data-testid={`button-copy-username-${entry.id}`}
                >
                  {copied === 'username' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}

            {entry.password && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">
                    {showPassword ? entry.password : "••••••••••••"}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid={`button-toggle-password-${entry.id}`}
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(entry.password!, 'password')}
                    data-testid={`button-copy-password-${entry.id}`}
                  >
                    {copied === 'password' ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {entry.twoFA && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">2FA: {entry.twoFA}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(entry.twoFA!, '2fa')}
                  data-testid={`button-copy-2fa-${entry.id}`}
                >
                  {copied === '2fa' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Payment Card Details */}
        {entry.type === "payment" && (
          <>
            {entry.cardNumber && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">
                    {showCardDetails ? entry.cardNumber : maskCardNumber(entry.cardNumber)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowCardDetails(!showCardDetails)}
                    data-testid={`button-toggle-card-${entry.id}`}
                  >
                    {showCardDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(entry.cardNumber!, 'card')}
                    data-testid={`button-copy-card-${entry.id}`}
                  >
                    {copied === 'card' ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span>Exp: {entry.expiryDate}</span>
              <span className="font-mono">
                CVV: {showCardDetails ? entry.cvv : "•••"}
              </span>
            </div>
          </>
        )}

        {/* Autofill Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => onAutofill?.(entry.id)}
          data-testid={`button-autofill-${entry.id}`}
        >
          Secure Autofill
        </Button>
      </CardContent>
    </Card>
  );
}