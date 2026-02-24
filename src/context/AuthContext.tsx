import React, { createContext, useContext, useState, useEffect } from "react";
import { User, apiLogin, AuthResult } from "@/services/apiAuth";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Cargar sesión guardada
        const saved = sessionStorage.getItem("crm_user");
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch (e) {
                sessionStorage.removeItem("crm_user");
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, pass: string): Promise<boolean> => {
        try {
            const res = await apiLogin(email, pass);
            if (res.ok && res.datos) {
                setUser(res.datos);
                sessionStorage.setItem("crm_user", JSON.stringify(res.datos));
                toast({ title: "Bienvenido", description: `Hola, ${res.datos.nombre}` });
                return true;
            } else {
                toast({
                    title: "Error de acceso",
                    description: res.mensaje || "Credenciales incorrectas",
                    variant: "destructive"
                });
                return false;
            }
        } catch (e) {
            toast({
                title: "Error de servidor",
                description: "No se pudo conectar con el servicio de autenticación.",
                variant: "destructive"
            });
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem("crm_user");
        toast({ title: "Sesión cerrada" });
    };

    const isAdmin = user?.rol === "ADMIN";

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
}
