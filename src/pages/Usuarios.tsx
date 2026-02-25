import { useState, useEffect } from "react";
import { User, apiListarUsuarios, apiCrearUsuario } from "@/services/apiAuth";
import { Shield, UserPlus, Mail, User as UserIcon, Loader2, RefreshCw, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Usuarios = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form, setForm] = useState({ email: "", password: "", nombre: "", rol: "USER" as User["rol"] });
    const [editForm, setEditForm] = useState({ id: "", email: "", password: "", nombre: "", rol: "USER" as User["rol"], activo: "Si" as User["activo"] });
    const [saving, setSaving] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await apiListarUsuarios();
            if (res.ok && res.datos) {
                setUsers(res.datos as unknown as User[]);
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudieron cargar los usuarios", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await apiCrearUsuario(form);
            if (res.ok) {
                toast({ title: "Éxito", description: "Usuario creado correctamente" });
                setModalOpen(false);
                setForm({ email: "", password: "", nombre: "", rol: "USER" });
                fetchUsers();
            } else {
                toast({ title: "Error", description: res.mensaje, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "Fallo al crear usuario", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { apiActualizarUsuario } = await import("@/services/apiAuth");
            const res = await apiActualizarUsuario(editForm.id, {
                email: editForm.email,
                nombre: editForm.nombre,
                rol: editForm.rol,
                activo: editForm.activo,
                ...(editForm.password ? { password: editForm.password } : {})
            });
            if (res.ok) {
                toast({ title: "Éxito", description: "Usuario actualizado" });
                setEditModalOpen(false);
                fetchUsers();
            } else {
                toast({ title: "Error", description: res.mensaje, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "Fallo al actualizar", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (!window.confirm(`¿Estás seguro de eliminar a "${user.nombre}"?`)) return;
        try {
            const { apiEliminarUsuario } = await import("@/services/apiAuth");
            const res = await apiEliminarUsuario(user.id);
            if (res.ok) {
                toast({ title: "Eliminado", description: "Usuario borrado correctamente" });
                fetchUsers();
            } else {
                toast({ title: "Error", description: res.mensaje, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
        }
    };

    const openEdit = (u: User) => {
        setEditingUser(u);
        setEditForm({
            id: u.id,
            email: u.email,
            password: "",
            nombre: u.nombre,
            rol: u.rol,
            activo: u.activo
        });
        setEditModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">Gestión de Usuarios</h2>
                    <p className="text-sm text-muted-foreground">Administra quién tiene acceso al CRM</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                    <UserPlus className="h-4 w-4" />
                    Nuevo Usuario
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <p className="mt-4 text-sm text-muted-foreground">Obteniendo lista de usuarios...</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {users.map((u) => (
                        <div key={u.id} className="relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-card-hover">
                            <div className="flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${u.rol === "ADMIN" ? "bg-amber-500/10 text-amber-500" :
                                    u.rol === "EMBAJADOR" ? "bg-purple-500/10 text-purple-500" :
                                        "bg-blue-500/10 text-blue-500"
                                    }`}>
                                    {u.rol}
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-display text-base font-bold text-foreground">{u.nombre}</h3>
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    {u.email}
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${u.activo === "Si" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {u.activo === "Si" ? "Activo" : "Inactivo"}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(u)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-accent">
                                        <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteUser(u)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-rose-500">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Crear Usuario */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
                    <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="gradient-navy p-5">
                            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-primary-foreground">
                                <Shield className="h-5 w-5" />
                                Crear Nuevo Acceso
                            </h3>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4 p-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Nombre Completo</label>
                                <input
                                    required
                                    value={form.nombre}
                                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Usuario / Email</label>
                                <input
                                    required
                                    type="text"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Contraseña Temporal</label>
                                <input
                                    required
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Rol de Acceso</label>
                                <select
                                    value={form.rol}
                                    onChange={e => setForm({ ...form, rol: e.target.value as any })}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="USER">Usuario (CRM)</option>
                                    <option value="EMBAJADOR">Embajador (Ventas)</option>
                                    <option value="ADMIN">Administrador (Total)</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground">Cancelar</button>
                                <button
                                    disabled={saving}
                                    className="rounded-lg bg-accent px-6 py-2 text-sm font-bold text-primary hover:opacity-90 disabled:opacity-50"
                                >
                                    {saving ? "Creando..." : "Crear Usuario"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Editar Usuario */}
            {editModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setEditModalOpen(false)}>
                    <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="gradient-navy p-5">
                            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-primary-foreground">
                                <Shield className="h-5 w-5" />
                                Editar Usuario: {editingUser?.nombre}
                            </h3>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4 p-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Nombre Completo</label>
                                <input
                                    required
                                    value={editForm.nombre}
                                    onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Email / Usuario</label>
                                <input
                                    required
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Nueva Contraseña (dejar vacío para no cambiar)</label>
                                <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Rol</label>
                                    <select
                                        value={editForm.rol}
                                        onChange={e => setEditForm({ ...editForm, rol: e.target.value as any })}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="USER">User</option>
                                        <option value="EMBAJADOR">Embajador</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Estado</label>
                                    <select
                                        value={editForm.activo}
                                        onChange={e => setEditForm({ ...editForm, activo: e.target.value as any })}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="Si">Activo</option>
                                        <option value="No">Desactivado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground">Cancelar</button>
                                <button
                                    disabled={saving}
                                    className="rounded-lg bg-accent px-6 py-2 text-sm font-bold text-primary hover:opacity-90 disabled:opacity-50"
                                >
                                    {saving ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;
