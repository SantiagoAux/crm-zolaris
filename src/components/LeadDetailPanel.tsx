import { Lead, ETAPAS } from "@/types/crm";
import { X, Phone, MapPin, Calendar, Zap, Sun, DollarSign, TrendingUp, Pencil, Trash2 } from "lucide-react";

interface LeadDetailPanelProps {
  lead: Lead | null;
  onClose: () => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const LeadDetailPanel = ({ lead, onClose, onEdit, onDelete }: LeadDetailPanelProps) => {
  if (!lead) return null;

  const details = [
    { icon: Calendar, label: "Fecha", value: lead.fecha },
    { icon: Phone, label: "Teléfono", value: lead.telefono },
    { icon: MapPin, label: "Ubicación", value: lead.ubicacion },
    { icon: Zap, label: "Potencia", value: lead.potencia },
    { icon: Sun, label: "Paneles", value: lead.paneles.toString() },
    { icon: Sun, label: "Producción Anual", value: lead.produccionAnual },
    { icon: DollarSign, label: "Valor Propuesta", value: formatCOP(lead.valorPropuesta) },
    { icon: TrendingUp, label: "Ahorro Mensual", value: formatCOP(lead.ahorro) },
    { icon: DollarSign, label: "Beneficios Totales", value: formatCOP(lead.beneficios) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-md animate-slide-in overflow-y-auto border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="gradient-navy p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-primary-foreground">{lead.nombre}</h2>
              <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-primary-foreground ${ETAPAS[lead.etapa].color}`}>
                {ETAPAS[lead.etapa].label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(lead)}
                  className="rounded-md p-1.5 text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(lead)}
                  className="rounded-md p-1.5 text-primary-foreground/70 hover:bg-red-500/20 hover:text-red-300"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button onClick={onClose} className="rounded-md p-1 text-primary-foreground/60 hover:text-primary-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-primary-foreground/70">{lead.motivo}</p>
        </div>

        {/* Details */}
        <div className="p-6">
          <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Detalle del Proyecto</h3>
          <div className="space-y-3">
            {details.map((d) => (
              <div key={d.label} className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
                <d.icon className="h-4 w-4 shrink-0 text-accent" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                  <p className="text-sm font-medium text-foreground">{d.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Alerta */}
          <div className="mt-6 rounded-lg gradient-solar p-4">
            <p className="text-xs font-semibold text-primary">TIPO DE ALERTA</p>
            <p className="mt-1 font-display text-lg font-bold text-primary">{lead.tipoAlerta}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailPanel;
