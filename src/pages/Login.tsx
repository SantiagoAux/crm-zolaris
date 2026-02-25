import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Sun, LogIn, Loader2 } from "lucide-react";

const Login = () => {
    const { user, login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    if (user) return <Navigate to="/" replace />;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await login(email, password);
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            {/* Abstract Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-accent/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-[400px] animate-fade-in">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-solar shadow-lg shadow-accent/20">
                        <Sun className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-white">ZOLARIS CRM</h1>
                    <p className="mt-2 text-sm text-slate-400">Introduce tus credenciales para acceder</p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                    <form onSubmit={handleSubmit} className="p-8">
                        {/* Hidden bait fields for aggressive browser autofill tools */}
                        <div style={{ display: "none" }}>
                            <input type="text" name="fake-username" autoComplete="off" />
                            <input type="password" name="fake-password" autoComplete="off" />
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                                    Usuario o Correo
                                </label>
                                <input
                                    type="text"
                                    name="user_email_crm"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="MONOZAM"
                                    autoComplete="off"
                                    className="w-full rounded-xl border border-white/5 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    name="user_pass_crm"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className="w-full rounded-xl border border-white/5 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-primary shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Entrar al Sistema</span>
                                        <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="border-t border-white/5 bg-white/5 p-4 text-center">
                        <p className="text-xs text-slate-500 italic">
                            Zolaris &copy; 2026 - Control Solar Residencial
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
