import { SidebarProvider } from "@/components/ui/sidebar";
import LockingMiNDSSidebar from '../LockingMiNDSSidebar';

export default function LockingMiNDSSidebarExample() {
  //todo: remove mock functionality
  const mockEntryCount = {
    total: 12,
    login: 8,
    payment: 4
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <LockingMiNDSSidebar 
          activeView="all"
          onViewChange={(view) => console.log('View changed to:', view)}
          onAddEntry={() => console.log('Add entry clicked')}
          onLogout={() => console.log('Logout clicked')}
          searchQuery=""
          onSearchChange={(query) => console.log('Search query:', query)}
          entryCount={mockEntryCount}
        />
        <div className="flex-1 p-6 bg-background">
          <p className="text-muted-foreground">Main content area</p>
        </div>
      </div>
    </SidebarProvider>
  );
}