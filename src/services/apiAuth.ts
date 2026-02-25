import { SHEETS_API_URL } from "@/config/api";

export interface User {
    id: string;
    email: string;
    nombre: string;
    rol: "ADMIN" | "USER" | "EMBAJADOR";
    activo: "Si" | "No";
}

export interface AuthResult {
    ok: boolean;
    mensaje?: string;
    datos?: User | User[];
}

async function callAuth(action: string, datos?: object): Promise<AuthResult> {
    const params = new URLSearchParams({ action });
    if (datos) params.set("datos", JSON.stringify(datos));

    const url = `${SHEETS_API_URL}?${params.toString()}`;

    const res = await fetch(url, { method: "GET", redirect: "follow" });
    if (!res.ok) throw new Error("Fallo en la comunicación con el servidor");

    return res.json() as Promise<AuthResult>;
}

export const apiLogin = (email: string, password: string) =>
    callAuth("login", { email, password });

export const apiListarUsuarios = () =>
    callAuth("listarUsuarios");

export const apiCrearUsuario = (datos: Partial<User> & { password?: string }) =>
    callAuth("crearUsuario", datos);

export const apiActualizarUsuario = (id: string, changes: Partial<User> & { password?: string }) =>
    callAuth("actualizarUsuario", { id, changes });

export const apiEliminarUsuario = (id: string) =>
    callAuth("eliminarUsuario", { id });
