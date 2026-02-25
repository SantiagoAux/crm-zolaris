import { useState, useEffect, useCallback } from "react";
import { Lead } from "@/types/crm";
import {
    apiLeerTodos,
    apiCrear,
    apiActualizar,
    apiEliminar,
    apiActualizarEtapa,
} from "@/services/sheetsApi";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface UseClientesReturn {
    leads: Lead[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    crearCliente: (lead: Omit<Lead, "id">) => Promise<boolean>;
    actualizarCliente: (fila: number, cambios: Partial<Lead>) => Promise<boolean>;
    actualizarEtapa: (fila: number, etapa: Lead["etapa"]) => Promise<boolean>;
    eliminarCliente: (fila: number) => Promise<boolean>;
}

export function useClientes(): UseClientesReturn {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Si el usuario es EMBAJADOR, solo pedimos sus leads
            const embajadorFilter = user?.rol === "EMBAJADOR" ? user.nombre : undefined;
            const data = await apiLeerTodos(embajadorFilter);

            // Enrich with synthetic id for React keys (use _fila cast via unknown)
            const enriched = data.map((l) => ({
                ...l,
                id: String((l as unknown as { _fila: number })._fila ?? Math.random()),
            }));
            setLeads(enriched);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Error al cargar clientes";
            setError(msg);
            toast({ title: "Error de conexión", description: msg, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const crearCliente = useCallback(
        async (lead: Omit<Lead, "id">): Promise<boolean> => {
            try {
                const res = await apiCrear(lead);
                if (!res.ok) throw new Error(res.mensaje ?? "Error al crear");
                toast({ title: "✅ Cliente creado", description: res.mensaje });
                await refetch();
                return true;
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Error al crear cliente";
                toast({ title: "❌ Error", description: msg, variant: "destructive" });
                return false;
            }
        },
        [refetch]
    );

    const actualizarCliente = useCallback(
        async (fila: number, cambios: Partial<Lead>): Promise<boolean> => {
            try {
                const res = await apiActualizar(fila, cambios);
                if (!res.ok) throw new Error(res.mensaje ?? "Error al actualizar");
                toast({ title: "✅ Cliente actualizado", description: res.mensaje });
                await refetch();
                return true;
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Error al actualizar";
                toast({ title: "❌ Error", description: msg, variant: "destructive" });
                return false;
            }
        },
        [refetch]
    );

    const actualizarEtapa = useCallback(
        async (fila: number, etapa: Lead["etapa"]): Promise<boolean> => {
            try {
                const res = await apiActualizarEtapa(fila, etapa);
                if (!res.ok) throw new Error(res.mensaje ?? "Error al actualizar etapa");
                toast({ title: "✅ Etapa actualizada" });
                await refetch();
                return true;
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Error al actualizar etapa";
                toast({ title: "❌ Error", description: msg, variant: "destructive" });
                return false;
            }
        },
        [refetch]
    );

    const eliminarCliente = useCallback(
        async (fila: number): Promise<boolean> => {
            try {
                const res = await apiEliminar(fila);
                if (!res.ok) throw new Error(res.mensaje ?? "Error al eliminar");
                toast({ title: "🗑️ Cliente eliminado", description: res.mensaje });
                await refetch();
                return true;
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Error al eliminar";
                toast({ title: "❌ Error", description: msg, variant: "destructive" });
                return false;
            }
        },
        [refetch]
    );

    return {
        leads,
        loading,
        error,
        refetch,
        crearCliente,
        actualizarCliente,
        actualizarEtapa,
        eliminarCliente,
    };
}
