
export interface ReportMetrics {
  totalRevenue?: number;
  servicesRevenue?: number;
  productsRevenue?: number;
  appointmentsRevenue?: number;
  salesCount?: number;
  servicesSalesCount?: number;
  productsSalesCount?: number;
  appointmentsCount?: number;
  salesChart?: { date: string; value: number }[];
  appointmentsChart?: { date: string; count: number }[];
  topProducts?: { id: string; name: string; quantity: number; revenue: number }[];
  topServices?: { id: string; name: string; quantity: number; revenue: number }[];
  topClients?: { id: string; name: string; visits: number; spent: number }[];
  appointmentStatusData?: { name: string; value: number }[];
  totalClients?: number;
  totalVisits?: number;
  totalItems?: number;
  exportedFile?: string;
  fileName?: string;
  fileType?: string;
  exportFormat?: string;
}
