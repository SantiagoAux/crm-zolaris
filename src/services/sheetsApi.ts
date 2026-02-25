import { SHEETS_API_URL } from "@/config/api";
import { Lead } from "@/types/crm";

// ── Tipos de respuesta ────────────────────────────────────────────────────────

export interface ApiResult {
    ok: boolean;
    mensaje?: string;
    datos?: unknown;
    fila?: number;
}

// ── Función base de fetch ─────────────────────────────────────────────────────

/**
 * Llama al Apps Script vía GET con parámetros de acción.
 * Se usa GET para evitar problemas de CORS/redirección de Apps Script con POST.
 */
async function callSheets(action: string, datos?: object): Promise<ApiResult> {
    const params = new URLSearchParams({ action });
    if (datos && Object.keys(datos).length > 0) {
        params.set("datos", JSON.stringify(datos));
    }

    const url = `${SHEETS_API_URL}?${params.toString()}`;

    console.log(`[API] Llamando a: ${action}`, datos || "");
    console.log(`[API] URL: ${url}`);

    try {
        const res = await fetch(url, {
            method: "GET",
            redirect: "follow",
        });

        if (!res.ok) {
            console.error(`[API] Error HTTP: ${res.status} ${res.statusText}`);
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json() as ApiResult;
        console.log(`[API] Respuesta de ${action}:`, data);
        return data;
    } catch (error) {
        console.error(`[API] Fallo en fetch para ${action}:`, error);
        if (error instanceof TypeError && error.message === "Failed to fetch") {
            throw new Error("Error de red/CORS: Verifica que el Script esté publicado como 'Cualquier persona' y que hayas aceptado los permisos con el botón 'Ejecutar'.");
        }
        throw error;
    }
}

// ── CRUD API functions ────────────────────────────────────────────────────────

/** Envía un ping al servidor para probar conexión */
export async function apiPing(): Promise<ApiResult> {
    return callSheets("ping");
}

/** Obtiene todos los clientes de la hoja, opcionalmente filtrados por embajador */
export async function apiLeerTodos(embajador?: string): Promise<Lead[]> {
    const res = await callSheets("leerTodos", { embajador });
    if (!res.ok) throw new Error(res.mensaje ?? "Error al leer clientes");
    return (res.datos as Lead[]) ?? [];
}

/** Crea un nuevo cliente. Retorna la fila creada. */
export async function apiCrear(lead: Omit<Lead, "id">): Promise<ApiResult> {
    return callSheets("crear", lead);
}

/** Actualiza un cliente por número de fila (campo _fila del objeto Lead) */
export async function apiActualizar(
    fila: number,
    cambios: Partial<Lead>
): Promise<ApiResult> {
    return callSheets("actualizar", { fila, cambios });
}

/** Actualiza solo la etapa de pipeline de un cliente */
export async function apiActualizarEtapa(
    fila: number,
    etapa: Lead["etapa"]
): Promise<ApiResult> {
    return callSheets("actualizarEtapa", { fila, etapa });
}

/** Elimina un cliente por número de fila */
export async function apiEliminar(fila: number): Promise<ApiResult> {
    return callSheets("eliminar", { fila });
}

/** Lee un cliente individual por fila */
export async function apiLeerFila(fila: number): Promise<Lead | null> {
    const res = await callSheets("leerFila", { fila });
    return (res.datos as Lead) ?? null;
}
