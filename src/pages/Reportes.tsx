import { Lead, ETAPAS, EtapaKey } from "@/types/crm";
import { useClientes } from "@/hooks/useClientes";
import { BarChart3, TrendingUp, Zap, Sun, Loader2 } from "lucide-react";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const Reportes = () => {
  const { leads, loading } = useClientes();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-3 text-muted-foreground">Calculando métricas...</span>
      </div>
    );
  }

  const totalPropuestas = leads.reduce((s, l) => s + l.valorPropuesta, 0);
  const totalAhorro = leads.reduce((s, l) => s + l.ahorro, 0);
  const totalBeneficios = leads.reduce((s, l) => s + l.beneficios, 0);
  const totalPaneles = leads.reduce((s, l) => s + l.paneles, 0);

  const etapaKeys = Object.keys(ETAPAS) as EtapaKey[];

  const byCity = leads.reduce<Record<string, { count: number; valor: number }>>((acc, l) => {
    if (!acc[l.ubicacion]) acc[l.ubicacion] = { count: 0, valor: 0 };
    acc[l.ubicacion].count++;
    acc[l.ubicacion].valor += l.valorPropuesta;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Reportes</h2>
        <p className="text-sm text-muted-foreground">Análisis de rendimiento comercial y técnico</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Valor Total", value: formatCOP(totalPropuestas), icon: BarChart3 },
          { label: "Ahorro Total Mensual", value: formatCOP(totalAhorro), icon: TrendingUp },
          { label: "Beneficios Totales", value: formatCOP(totalBeneficios), icon: Zap },
          { label: "Paneles Totales", value: totalPaneles.toString(), icon: Sun },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-4">
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 font-display text-xl font-bold text-foreground">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Breakdown */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Distribución por Etapa</h3>
        <div className="space-y-3">
          {etapaKeys.map((etapa) => {
            const items = leads.filter((l) => l.etapa === etapa);
            const pct = leads.length ? (items.length / leads.length) * 100 : 0;
            const valor = items.reduce((s, l) => s + l.valorPropuesta, 0);
            return (
              <div key={etapa}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{ETAPAS[etapa].label}</span>
                  <span className="text-muted-foreground">{items.length} leads · {formatCOP(valor)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${ETAPAS[etapa].color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By City */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Oportunidades por Ciudad</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Ciudad</th>
                <th className="px-4 py-2 text-center font-medium text-muted-foreground">Leads</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCity).map(([city, data]) => (
                <tr key={city} className="border-b border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{city}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{data.count}</td>
                  <td className="px-4 py-3 text-right text-foreground">{formatCOP(data.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
