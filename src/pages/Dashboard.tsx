import { Lead } from "@/types/crm";
import { useClientes } from "@/hooks/useClientes";
import { useState } from "react";
import KPICards from "@/components/KPICards";
import LeadsTable from "@/components/LeadsTable";
import LeadDetailPanel from "@/components/LeadDetailPanel";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { leads, loading } = useClientes();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // 10 leads más recientes (los últimos de la lista, invertidos para que el más nuevo esté primero)
  const recentLeads = [...leads].reverse().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Resumen general de oportunidades</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
          <span className="ml-3 text-muted-foreground">Cargando datos...</span>
        </div>
      ) : (
        <>
          <KPICards leads={leads} />

          <div>
            <h3 className="mb-3 font-display text-lg font-semibold text-foreground">
              Leads Recientes
            </h3>
            <LeadsTable leads={recentLeads} onSelect={setSelectedLead} />
          </div>

          <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
