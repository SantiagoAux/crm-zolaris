import { Lead, ETAPAS, EtapaKey } from "@/types/crm";

interface PipelineViewProps {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onEtapaChange?: (lead: Lead, nuevaEtapa: Lead["etapa"]) => void;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const PipelineView = ({ leads, onSelect, onEtapaChange }: PipelineViewProps) => {
  const etapas = Object.keys(ETAPAS) as EtapaKey[];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
      {etapas.map((etapa) => {
        const items = leads.filter((l) => l.etapa === etapa);
        const total = items.reduce((s, l) => s + l.valorPropuesta, 0);
        return (
          <div key={etapa} className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
            <div className={`flex items-center justify-between p-3 ${ETAPAS[etapa].color}`}>
              <span className="text-sm font-semibold text-primary-foreground">{ETAPAS[etapa].label}</span>
              <span className="rounded-full bg-background/20 px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {items.length}
              </span>
            </div>
            <div className="p-2 text-xs text-muted-foreground">
              {formatCOP(total)}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2">
              {items.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onSelect(lead)}
                  className="cursor-pointer rounded-md border border-border bg-background p-3 transition-all hover:shadow-card-hover"
                >
                  <p className="font-medium text-foreground text-sm">{lead.nombre}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{lead.ubicacion} · {lead.potencia}</p>
                  <p className="mt-1 text-xs font-semibold text-foreground">{formatCOP(lead.valorPropuesta)}</p>
                  {/* Cambiar etapa */}
                  {onEtapaChange && (
                    <div className="mt-2 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                      {etapas
                        .filter((e) => e !== lead.etapa)
                        .map((e) => (
                          <button
                            key={e}
                            onClick={() => onEtapaChange(lead, e)}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium text-primary-foreground opacity-60 hover:opacity-100 transition-opacity ${ETAPAS[e].color}`}
                            title={`Mover a ${ETAPAS[e].label}`}
                          >
                            → {ETAPAS[e].label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">Sin leads</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PipelineView;
