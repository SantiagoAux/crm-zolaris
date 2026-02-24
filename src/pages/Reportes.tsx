import { Lead, ETAPAS, EtapaKey } from "@/types/crm";
import { useClientes } from "@/hooks/useClientes";
import { BarChart3, TrendingUp, Zap, Sun, Loader2, PieChart as PieIcon, Activity } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

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

  // Data for Pie Chart
  const pieData = etapaKeys.map(key => ({
    name: ETAPAS[key].label,
    value: leads.filter(l => l.etapa === key).length,
    valorEconomico: leads.filter(l => l.etapa === key).reduce((s, l) => s + l.valorPropuesta, 0),
    color: key === 'cierre_ganado' ? '#10b981' :
      key === 'cierre_perdido' ? '#ef4444' :
        key === 'negociacion' ? '#f59e0b' :
          key === 'cotizacion' ? '#fbbf24' : '#3b82f6'
  })).filter(d => d.value > 0);

  // Data for Frequency Polygon (Line Chart) - Value per Month
  const dataByMonth = leads.reduce<Record<string, number>>((acc, l) => {
    if (!l.fecha) return acc;

    let year: number, month: number;
    // Handle YYYY-MM-DD or YYYY-MM-DD HH:MM
    if (l.fecha.includes('-')) {
      const parts = l.fecha.split(' ')[0].split('-');
      year = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
    }
    // Handle DD/MM/YYYY
    else if (l.fecha.includes('/')) {
      const parts = l.fecha.split(' ')[0].split('/');
      const day = parseInt(parts[0]); // 'day' variable is introduced but not used for the Date object, which is fine.
      month = parseInt(parts[1]) - 1;
      year = parseInt(parts[2]);
      if (year < 100) year += 2000; // Handle 2-digit years
    }
    else {
      const d = new Date(l.fecha);
      if (isNaN(d.getTime())) return acc;
      year = d.getFullYear();
      month = d.getMonth();
    }

    const date = new Date(year, month, 1);
    if (isNaN(date.getTime())) return acc;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const value = Number(l.valorPropuesta) || 0;
    acc[key] = (acc[key] || 0) + value;
    return acc;
  }, {});

  const lineData = Object.entries(dataByMonth)
    .sort((a, b) => a[0].localeCompare(b[0])) // Strict alphabetical sort on YYYY-MM
    .map(([monthKey, valor]) => {
      const [y, m] = monthKey.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      const monthName = d.toLocaleDateString('es-CO', { month: 'long' });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return {
        month: monthKey,
        valor,
        displayMonth: `${capitalizedMonth} de ${y}`
      };
    });

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-semibold text-foreground">Distribución por Etapa</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} leads (${formatCOP(props.payload.valorEconomico)})`,
                    name
                  ]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-semibold text-foreground">Valor de Proyectos por Mes</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis
                  dataKey="displayMonth"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `$${value / 1000000}M`}
                />
                <RechartsTooltip
                  formatter={(value: number) => [formatCOP(value), "Valor Total"]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'hsl(var(--accent))', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pipeline Breakdown (Mini Table) */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Resumen Numérico</h3>
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
