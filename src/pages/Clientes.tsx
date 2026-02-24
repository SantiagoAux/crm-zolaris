import { useState } from "react";
import { Lead } from "@/types/crm";
import { useClientes } from "@/hooks/useClientes";
import LeadsTable from "@/components/LeadsTable";
import LeadDetailPanel from "@/components/LeadDetailPanel";
import { ClienteFormModal } from "@/components/ClienteFormModal";
import { Loader2, RefreshCw, PlusCircle, AlertCircle } from "lucide-react";

const Clientes = () => {
  const {
    leads,
    loading,
    error,
    refetch,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
  } = useClientes();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  const handleDelete = async (lead: Lead) => {
    const fila = (lead as unknown as { _fila?: number })._fila;
    if (!fila) return;
    if (!window.confirm(`¿Eliminar a "${lead.nombre}"? Esta acción es irreversible.`)) return;
    await eliminarCliente(fila);
    if (selectedLead?.id === lead.id) setSelectedLead(null);
  };

  const handleSave = async (data: Omit<Lead, "id">, fila?: number) => {
    if (fila) {
      return actualizarCliente(fila, data);
    } else {
      return crearCliente(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Clientes</h2>
          <p className="text-sm text-muted-foreground">
            Gestión y seguimiento de todos los contactos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/40 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          <button
            onClick={() => { setEditingLead(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => refetch()} className="ml-auto underline">
            Reintentar
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="ml-3 text-muted-foreground">Cargando clientes desde Google Sheets...</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <LeadsTable
          leads={leads}
          onSelect={setSelectedLead}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <LeadDetailPanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ClienteFormModal
        open={modalOpen}
        lead={editingLead}
        onClose={() => { setModalOpen(false); setEditingLead(null); }}
        onSave={handleSave}
      />
    </div>
  );
};

export default Clientes;
