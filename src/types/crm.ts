export interface Lead {
  id: string;
  fecha: string;
  nombre: string;
  telefono: string;
  ubicacion: string;
  motivo: string;
  tipoAlerta: string;
  valorPropuesta: number;
  potencia: string;
  ahorro: number;
  beneficios: number;
  paneles: number;
  produccionAnual: string;
  etapa: 'contacto' | 'cotizacion' | 'negociacion' | 'cierre';
  notas?: string[];
}

export type EtapaKey = Lead['etapa'];

export const ETAPAS: Record<EtapaKey, { label: string; color: string }> = {
  contacto: { label: 'Contacto', color: 'bg-info' },
  cotizacion: { label: 'Cotización', color: 'bg-warning' },
  negociacion: { label: 'Negociación', color: 'bg-accent' },
  cierre: { label: 'Cierre', color: 'bg-success' },
};
