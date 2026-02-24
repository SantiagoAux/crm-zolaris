import { Lead } from "@/types/crm";
import { useClientes } from "@/hooks/useClientes";
import { useState } from "react";
import PipelineView from "@/components/PipelineView";
import LeadDetailPanel from "@/components/LeadDetailPanel";
import { Loader2 } from "lucide-react";

const Pipeline = () => {
  const { leads, loading, actualizarEtapa } = useClientes();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleEtapaChange = async (lead: Lead, nuevaEtapa: Lead["etapa"]) => {
    const fila = (lead as unknown as { _fila?: number })._fila;
    if (!fila) return;
    await actualizarEtapa(fila, nuevaEtapa);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Pipeline</h2>
        <p className="text-sm text-muted-foreground">Vista Kanban del proceso de venta</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
          <span className="ml-3 text-muted-foreground">Cargando pipeline...</span>
        </div>
      ) : (
        <PipelineView
          leads={leads}
          onSelect={setSelectedLead}
          onEtapaChange={handleEtapaChange}
        />
      )}

      <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
};

export default Pipeline;
