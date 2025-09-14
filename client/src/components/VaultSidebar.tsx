import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  Shield, 
  Plus, 
  Search, 
  Globe, 
  CreditCard, 
  Eye, 
  Settings,
  Lock,
  LogOut
} from "lucide-react";
import lockMindLogo from "@assets/LockingMiNDS.png";

interface VaultSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onAddEntry: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  entryCount: {
    total: number;
    login: number;
    payment: number;
  };
}

export default function VaultSidebar({ 
  activeView, 
  onViewChange, 
  onAddEntry,
  onLogout,
  searchQuery, 
  onSearchChange,
  entryCount 
}: VaultSidebarProps) {
  
  const menuItems = [
    {
      title: "All Items",
      view: "all",
      icon: Shield,
      count: entryCount.total,
    },
    {
      title: "Logins",
      view: "logins",
      icon: Globe,
      count: entryCount.login,
    },
    {
      title: "Payment Cards",
      view: "payments",
      icon: CreditCard,
      count: entryCount.payment,
    },
    {
      title: "Security",
      view: "security",
      icon: Eye,
      count: undefined,
    },
    {
      title: "Settings",
      view: "settings",
      icon: Settings,
      count: undefined,
    }
  ];

  return (
    <Sidebar>
      <SidebarContent>
        {/* Header */}
        <SidebarGroup>
          <div className="px-3 py-2">
            <div className="flex items-center space-x-3 mb-4">
              <img src={lockMindLogo} alt="LockingMiNDS" className="h-8 w-8" />
              <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-blue-600 bg-clip-text text-transparent">
                LockingMiNDS
              </h2>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vault..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            {/* Add Entry Button */}
            <Button 
              className="w-full mt-3"
              onClick={onAddEntry}
              data-testid="button-add-entry"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </SidebarGroup>

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Vault</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton 
                    onClick={() => onViewChange(item.view)}
                    isActive={activeView === item.view}
                    data-testid={`button-nav-${item.view}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.title}</span>
                    {item.count !== undefined && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto text-xs"
                        data-testid={`badge-count-${item.view}`}
                      >
                        {item.count}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Security Status */}
        <SidebarGroup>
          <SidebarGroupLabel>Security</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Encryption</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Session</span>
                <div className="flex items-center space-x-1">
                  <Lock className="h-3 w-3 text-green-500" />
                  <span className="text-xs">Secure</span>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <Button 
              variant="outline" 
              className="mx-3 mb-3"
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Lock Vault
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}