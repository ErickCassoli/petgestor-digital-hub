// src/types/reports.ts

export interface SaleChartEntry {
  date: string;
  value: number;
}

export interface AppointmentChartEntry {
  date: string;
  count: number;
}

export interface AppointmentStatusEntry {
  name: string;
  value: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface ProductItem {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface ClientVisit {
  id: string;
  name: string;
  visits: number;
  spent: number;
}

export interface ReportMetrics {
  // === Faturamento ===
  totalRevenue: number;
  servicesRevenue: number;
  productsRevenue: number;
  appointmentsRevenue: number;
  salesCount: number;
  servicesSalesCount: number;
  productsSalesCount: number;
  appointmentsCount: number;
  salesChart: SaleChartEntry[];

  // === Serviços ===
  topServices?: ServiceItem[];

  // === Produtos ===
  topProducts?: ProductItem[];

  // === Clientes ===
  topByVisits?: ClientVisit[];
  topBySpending?: ClientVisit[];
  totalClients?: number;
  totalVisits?: number;
  totalSpent?: number;

  // === Agendamentos ===
  appointmentsChart?: AppointmentChartEntry[];
  appointmentStatusData?: AppointmentStatusEntry[];
}
