import { Lead } from "@/types/crm";
import { DollarSign, Zap, Users, TrendingUp } from "lucide-react";

interface KPICardsProps {
  leads: Lead[];
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

const KPICards = ({ leads }: KPICardsProps) => {
  const totalPropuestas = leads.reduce((s, l) => s + l.valorPropuesta, 0);
  const totalAhorro = leads.reduce((s, l) => s + l.ahorro, 0);
  const totalPaneles = leads.reduce((s, l) => s + l.paneles, 0);
  const ticketPromedio = leads.length ? totalPropuestas / leads.length : 0;

  const kpis = [
    {
      label: "Oportunidades",
      value: leads.length.toString(),
      icon: Users,
      accent: true,
    },
    {
      label: "Valor Total Propuestas",
      value: formatCOP(totalPropuestas),
      icon: DollarSign,
    },
    {
      label: "Ahorro Mensual Total",
      value: formatCOP(totalAhorro),
      icon: TrendingUp,
    },
    {
      label: "Ticket Promedio",
      value: formatCOP(ticketPromedio),
      icon: Zap,
    },
    {
      label: "Paneles Totales",
      value: totalPaneles.toString(),
      icon: Zap,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {kpis.map((kpi, i) => (
        <div
          key={kpi.label}
          className={`group relative overflow-hidden rounded-lg border p-4 transition-all hover:shadow-card-hover ${
            kpi.accent
              ? "gradient-solar border-transparent"
              : "border-border bg-card"
          }`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center justify-between">
            <kpi.icon
              className={`h-5 w-5 ${kpi.accent ? "text-primary" : "text-muted-foreground"}`}
            />
          </div>
          <p
            className={`mt-3 font-display text-xl font-bold leading-tight ${
              kpi.accent ? "text-primary" : "text-foreground"
            }`}
          >
            {kpi.value}
          </p>
          <p
            className={`mt-1 text-xs ${
              kpi.accent ? "text-primary/70" : "text-muted-foreground"
            }`}
          >
            {kpi.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
