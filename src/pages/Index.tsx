import { Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./Dashboard";
import Clientes from "./Clientes";
import Pipeline from "./Pipeline";
import Reportes from "./Reportes";
import Usuarios from "./Usuarios";
import { useAuth } from "@/context/AuthContext";
import { AdminRoute } from "@/components/ProtectedRoute";
import { LogOut, User } from "lucide-react";

const Index = () => {
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="font-display text-lg font-bold text-foreground">ZOLARIS</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 md:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
                  <User className="h-4 w-4 text-accent" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground leading-none">{user?.nombre}</span>
                  <span className="text-[10px] text-muted-foreground">{user?.rol}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="reportes" element={<Reportes />} />

              <Route element={<AdminRoute />}>
                <Route path="usuarios" element={<Usuarios />} />
              </Route>
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
