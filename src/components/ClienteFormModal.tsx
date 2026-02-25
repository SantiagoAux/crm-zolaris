import { useState, useEffect } from "react";
import { Lead, ETAPAS, EtapaKey } from "@/types/crm";
import { X } from "lucide-react";
import { User } from "@/services/apiAuth";

interface ClienteFormModalProps {
    open: boolean;
    lead?: Lead | null; // si viene, es edición; si no, es creación
    onClose: () => void;
    onSave: (data: Omit<Lead, "id">, fila?: number) => Promise<boolean>;
}

const EMPTY: Omit<Lead, "id"> = {
    fecha: "",
    nombre: "",
    telefono: "",
    ubicacion: "",
    motivo: "Cliente Potencial detectado (>300 kWh)",
    tipoAlerta: "OPORTUNIDAD VENTA",
    valorPropuesta: 0,
    potencia: "",
    ahorro: 0,
    beneficios: 0,
    paneles: 0,
    produccionAnual: "",
    etapa: "contacto",
    notas: [],
    embajador: "",
};

export function ClienteFormModal({ open, lead, onClose, onSave }: ClienteFormModalProps) {
    const [form, setForm] = useState<Omit<Lead, "id">>(EMPTY);
    const [saving, setSaving] = useState(false);
    const [ambassadors, setAmbassadors] = useState<{ nombre: string }[]>([]);

    useEffect(() => {
        const fetchAmbassadors = async () => {
            try {
                const { apiListarUsuarios } = await import("@/services/apiAuth");
                const res = await apiListarUsuarios();
                if (res.ok && res.datos && Array.isArray(res.datos)) {
                    const filtered = (res.datos as User[]).filter(u => u.rol === "EMBAJADOR");
                    setAmbassadors(filtered);
                }
            } catch (e) {
                console.error("Error fetching ambassadors:", e);
            }
        };
        if (open) fetchAmbassadors();
    }, [open]);

    useEffect(() => {
        if (lead) {
            setForm({
                fecha: lead.fecha,
                nombre: lead.nombre,
                telefono: lead.telefono,
                ubicacion: lead.ubicacion,
                motivo: lead.motivo,
                tipoAlerta: lead.tipoAlerta,
                valorPropuesta: lead.valorPropuesta,
                potencia: lead.potencia,
                ahorro: lead.ahorro,
                beneficios: lead.beneficios,
                paneles: lead.paneles,
                produccionAnual: lead.produccionAnual,
                etapa: lead.etapa,
                notas: lead.notas ?? [],
                embajador: lead.embajador ?? "",
            });
        } else {
            setForm(EMPTY);
        }
    }, [lead, open]);

    if (!open) return null;

    const set = (field: keyof typeof form, value: unknown) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const fila = lead
            ? (lead as unknown as { _fila?: number })._fila
            : undefined;
        const ok = await onSave(form, fila);
        setSaving(false);
        if (ok) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative h-full max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="gradient-navy flex items-center justify-between p-5">
                    <h2 className="font-display text-lg font-bold text-primary-foreground">
                        {lead ? "Editar Cliente" : "Nuevo Cliente"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-primary-foreground/60 hover:text-primary-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-6">
                    {/* Nombre */}
                    <div className="col-span-2 flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Nombre *
                        </label>
                        <input
                            required
                            value={form.nombre}
                            onChange={(e) => set("nombre", e.target.value)}
                            placeholder="Carlos Martínez"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Teléfono */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Teléfono *
                        </label>
                        <input
                            required
                            value={form.telefono}
                            onChange={(e) => set("telefono", e.target.value)}
                            placeholder="573229132643"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Ciudad */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Ciudad *
                        </label>
                        <input
                            required
                            value={form.ubicacion}
                            onChange={(e) => set("ubicacion", e.target.value)}
                            placeholder="Pasto"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Etapa */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Etapa
                        </label>
                        <select
                            value={form.etapa}
                            onChange={(e) => set("etapa", e.target.value as EtapaKey)}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {(Object.keys(ETAPAS) as EtapaKey[]).map((k) => (
                                <option key={k} value={k}>
                                    {ETAPAS[k].label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Potencia */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Potencia
                        </label>
                        <input
                            value={form.potencia}
                            onChange={(e) => set("potencia", e.target.value)}
                            placeholder="3.71 kWp"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Valor Propuesta */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Valor Propuesta (COP)
                        </label>
                        <input
                            type="number"
                            value={form.valorPropuesta || ""}
                            onChange={(e) => set("valorPropuesta", parseFloat(e.target.value) || 0)}
                            placeholder="15422149"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Ahorro */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Ahorro Mensual (COP)
                        </label>
                        <input
                            type="number"
                            value={form.ahorro || ""}
                            onChange={(e) => set("ahorro", parseFloat(e.target.value) || 0)}
                            placeholder="287580"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Beneficios */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Beneficios Totales (COP)
                        </label>
                        <input
                            type="number"
                            value={form.beneficios || ""}
                            onChange={(e) => set("beneficios", parseFloat(e.target.value) || 0)}
                            placeholder="6168860"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Paneles */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Paneles
                        </label>
                        <input
                            type="number"
                            value={form.paneles || ""}
                            onChange={(e) => set("paneles", parseInt(e.target.value) || 0)}
                            placeholder="6"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Producción Anual */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Producción Anual
                        </label>
                        <input
                            value={form.produccionAnual}
                            onChange={(e) => set("produccionAnual", e.target.value)}
                            placeholder="4,948 kWh/año"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Tipo de Alerta */}
                    <div className="col-span-2 flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Tipo de Alerta
                        </label>
                        <input
                            value={form.tipoAlerta}
                            onChange={(e) => set("tipoAlerta", e.target.value)}
                            placeholder="OPORTUNIDAD VENTA"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Motivo */}
                    <div className="col-span-2 flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">
                            Motivo
                        </label>
                        <input
                            value={form.motivo}
                            onChange={(e) => set("motivo", e.target.value)}
                            placeholder="Cliente Potencial detectado (>300 kWh)"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Embajador */}
                    {ambassadors.length > 0 && (
                        <div className="col-span-2 flex flex-col gap-1">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">
                                Embajador Asignado
                            </label>
                            <select
                                value={form.embajador}
                                onChange={(e) => set("embajador", e.target.value)}
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">Sin asignar (Admin)</option>
                                {ambassadors.map((a) => (
                                    <option key={a.nombre} value={a.nombre}>
                                        {a.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="col-span-2 flex justify-end gap-3 border-t border-border pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/40"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        >
                            {saving ? "Guardando..." : lead ? "Guardar cambios" : "Crear cliente"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
