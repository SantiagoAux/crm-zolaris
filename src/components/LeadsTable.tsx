import { Lead, ETAPAS, EtapaKey } from "@/types/crm";
import { useState } from "react";
import { Phone, MapPin, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface LeadsTableProps {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const LeadsTable = ({ leads, onSelect, onEdit, onDelete }: LeadsTableProps) => {
  const { isAdmin } = useAuth();
  const [filterCity, setFilterCity] = useState("");
  const [filterEtapa, setFilterEtapa] = useState<string>("");
  const [filterEmbajador, setFilterEmbajador] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const cities = [...new Set(leads.map((l) => l.ubicacion))];
  const ambassadors = [...new Set(leads.map((l) => l.embajador).filter(Boolean))];

  const filtered = leads.filter((l) => {
    if (filterCity && l.ubicacion !== filterCity) return false;
    if (filterEtapa && l.etapa !== filterEtapa) return false;
    if (filterEmbajador && l.embajador !== filterEmbajador) return false;
    if (searchTerm && !l.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterEtapa}
          onChange={(e) => setFilterEtapa(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas las etapas</option>
          {(Object.keys(ETAPAS) as EtapaKey[]).map((k) => (
            <option key={k} value={k}>{ETAPAS[k].label}</option>
          ))}
        </select>
        {isAdmin && ambassadors.length > 0 && (
          <select
            value={filterEmbajador}
            onChange={(e) => setFilterEmbajador(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los embajadores</option>
            {ambassadors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} resultados</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Ubicación</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Embajador</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor Propuesta</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Etapa</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                {onEdit || onDelete ? "Acciones" : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead, i) => (
              <tr
                key={lead.id}
                onClick={() => onSelect(lead)}
                className="cursor-pointer border-b border-border transition-colors hover:bg-muted/40 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{lead.nombre}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {lead.telefono}
                  </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {lead.ubicacion}
                  </div>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {lead.embajador || "Admin"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{formatCOP(lead.valorPropuesta)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-primary-foreground ${ETAPAS[lead.etapa].color}`}>
                    {ETAPAS[lead.etapa].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {(onEdit || onDelete) ? (
                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(lead)}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent/20 hover:text-accent"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(lead)}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No hay clientes que mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadsTable;
