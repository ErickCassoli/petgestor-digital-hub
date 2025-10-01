
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Define your Supabase URL and service role key
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface ReportMetrics {
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-requested-with",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Extract parameters
    const userId = body.userId;
    const reportType = body.reportType || "revenue";
    const startDate = body.startDate;
    const endDate = body.endDate;
    const exportFormat = body.exportFormat;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "Start date and end date are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let reportData: ReportMetrics | null = null;

    switch (reportType) {
      case "revenue":
        reportData = await generateRevenueReport(supabase, userId, startDate, endDate);
        break;
      case "services":
        reportData = await generateServicesReport(supabase, userId, startDate, endDate);
        break;
      case "products":
        reportData = await generateProductsReport(supabase, userId, startDate, endDate);
        break;
      case "clients":
        reportData = await generateClientsReport(supabase, userId, startDate, endDate);
        break;
      case "appointments":
        reportData = await generateAppointmentsReport(supabase, userId, startDate, endDate);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid report type" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    if (exportFormat) {
      // Simulate export functionality (in a real scenario, you'd use a library to generate the export)
      // For demonstration purposes, we'll just send back a mock base64 encoded file
      const mockExportedFile = btoa(
        `This is a mock ${exportFormat} export for ${reportType} report from ${startDate} to ${endDate}`
      );

      reportData = {
        ...reportData,
        exportedFile: mockExportedFile,
        fileName: `report_${reportType}_${new Date().toISOString().split("T")[0]}.${exportFormat}`,
        fileType: exportFormat,
      };
    }

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred while generating the report" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function generateRevenueReport(supabase, userId: string, startDate: string, endDate: string): Promise<ReportMetrics> {
  // Fetch sales data
  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .eq('user_id', userId)
    .gte('sale_date', startDate)
    .lte('sale_date', endDate)
    .order('sale_date', { ascending: true });
  
  if (salesError) {
    throw new Error(`Error fetching sales: ${salesError.message}`);
  }

  // Fetch completed appointments data
  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*, service:service_id(price)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('date', startDate)
    .lte('date', endDate);
  
  if (appointmentsError) {
    throw new Error(`Error fetching appointments: ${appointmentsError.message}`);
  }

  // Calculate appointments revenue
  const completedAppointments = {
    count: appointmentsData ? appointmentsData.length : 0,
    revenue: appointmentsData
      ? appointmentsData.reduce((sum, appt) => {
          const price = appt.service ? Number(appt.service.price) : 0;
          return sum + price;
        }, 0)
      : 0,
  };

  // Initialize metrics
  if (!salesData || salesData.length === 0) {
    return {
      totalRevenue: completedAppointments.revenue,
      servicesRevenue: 0,
      productsRevenue: 0,
      appointmentsRevenue: completedAppointments.revenue,
      salesCount: 0,
      servicesSalesCount: 0,
      productsSalesCount: 0,
      appointmentsCount: completedAppointments.count,
      salesChart: [],
    };
  }

  // Calculate total revenue from sales directly using the total field
  const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.total || 0), 0) + completedAppointments.revenue;

  // Get sale items to accurately distinguish between services and products revenue
  const { data: saleItems, error: saleItemsError } = await supabase
    .from('sale_items')
    .select('sale_id, type, total')
    .in('sale_id', salesData.map(sale => sale.id));

  if (saleItemsError) {
    throw new Error(`Error fetching sale items: ${saleItemsError.message}`);
  }

  // Calculate by type using sale items for accuracy
  let servicesRevenue = 0;
  let productsRevenue = 0;

  if (saleItems && saleItems.length > 0) {
    for (const item of saleItems) {
      if (item.type === 'service') {
        servicesRevenue += Number(item.total || 0);
      } else if (item.type === 'product') {
        productsRevenue += Number(item.total || 0);
      }
    }
  } else {
    // Fallback to sales type if items are not available
    const servicesSales = (salesData || []).filter((sale) => sale.type === "service");
    const productsSales = (salesData || []).filter((sale) => sale.type === "product");
    const mixedSales = (salesData || []).filter((sale) => sale.type === "mixed");

    servicesRevenue = servicesSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    productsRevenue = productsSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    // Split mixed sales 50/50 if we don't have item-level data
    const mixedRevenue = mixedSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    servicesRevenue += mixedRevenue / 2;
    productsRevenue += mixedRevenue / 2;
  }

  // Group sales by date for chart
  const salesByDate = (salesData || []).reduce((acc, sale) => {
    if (!sale.sale_date) return acc;
    
    const dateStr = sale.sale_date.substring(0, 10);
    
    if (!acc[dateStr]) {
      acc[dateStr] = 0;
    }
    
    acc[dateStr] += Number(sale.total || 0);
    return acc;
  }, {});

  // Add appointment revenue to the chart data
  if (appointmentsData && appointmentsData.length > 0) {
    for (const appointment of appointmentsData) {
      if (!appointment.date) continue;
      
      const dateStr = appointment.date.substring(0, 10);
      
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = 0;
      }
      
      const price = appointment.service ? Number(appointment.service.price) : 0;
      salesByDate[dateStr] += price;
    }
  }

  const salesChart = Object.keys(salesByDate).map((date) => ({
    date,
    value: salesByDate[date],
  }));

  return {
    totalRevenue,
    servicesRevenue,
    productsRevenue,
    appointmentsRevenue: completedAppointments.revenue,
    salesCount: (salesData || []).length,
    appointmentsCount: completedAppointments.count,
    servicesSalesCount: saleItems ? saleItems.filter(item => item.type === 'service').length : 0,
    productsSalesCount: saleItems ? saleItems.filter(item => item.type === 'product').length : 0,
    salesChart,
  };
}

async function generateServicesReport(supabase, userId: string, startDate: string, endDate: string): Promise<ReportMetrics> {
  const { data: saleItems, error: saleItemsError } = await supabase
    .from('sale_items')
    .select(`
      *,
      sales!inner(*),
      services(*)
    `)
    .eq('sales.user_id', userId)
    .gte('sales.sale_date', startDate)
    .lte('sales.sale_date', endDate)
    .eq('type', 'service');

  if (saleItemsError) {
    throw new Error(`Error fetching service sales: ${saleItemsError.message}`);
  }

  // Fetch completed appointments to include in services data
  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .select(`
      *,
      service:service_id(id, name, price)
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('date', startDate)
    .lte('date', endDate);

  if (appointmentsError) {
    throw new Error(`Error fetching appointments: ${appointmentsError.message}`);
  }

  const servicesData = {};
  
  // Process sale items
  (saleItems || []).forEach(item => {
    if (!item.service_id || !item.services) return;
    
    if (!servicesData[item.service_id]) {
      servicesData[item.service_id] = {
        id: item.service_id,
        name: item.services.name,
        quantity: 0,
        revenue: 0
      };
    }
    
    servicesData[item.service_id].quantity += item.quantity;
    servicesData[item.service_id].revenue += Number(item.price) * item.quantity;
  });

  // Add appointments data
  (appointmentsData || []).forEach(appointment => {
    if (!appointment.service_id || !appointment.service) return;
    
    if (!servicesData[appointment.service_id]) {
      servicesData[appointment.service_id] = {
        id: appointment.service_id,
        name: appointment.service.name,
        quantity: 0,
        revenue: 0
      };
    }
    
    servicesData[appointment.service_id].quantity += 1;
    servicesData[appointment.service_id].revenue += Number(appointment.service.price);
  });

  const topServices = Object.values(servicesData)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10);

  const totalRevenue = (topServices as any[]).reduce((sum, service) => sum + service.revenue, 0);
  const totalItems = (topServices as any[]).reduce((sum, service) => sum + service.quantity, 0);

  return {
    topServices: topServices as any[],
    totalRevenue,
    totalItems,
    servicesRevenue: totalRevenue,
    servicesSalesCount: totalItems
  };
}

async function generateProductsReport(supabase, userId: string, startDate: string, endDate: string): Promise<ReportMetrics> {
  const { data: saleItems, error: saleItemsError } = await supabase
    .from('sale_items')
    .select(`
      *,
      sales!inner(*),
      products(*)
    `)
    .eq('sales.user_id', userId)
    .gte('sales.sale_date', startDate)
    .lte('sales.sale_date', endDate)
    .eq('type', 'product');

  if (saleItemsError) {
    throw new Error(`Error fetching product sales: ${saleItemsError.message}`);
  }

  const productsData = {};
  
  (saleItems || []).forEach(item => {
    if (!item.product_id || !item.products) return;
    
    if (!productsData[item.product_id]) {
      productsData[item.product_id] = {
        id: item.product_id,
        name: item.products.name,
        quantity: 0,
        revenue: 0
      };
    }
    
    productsData[item.product_id].quantity += item.quantity;
    productsData[item.product_id].revenue += Number(item.price) * item.quantity;
  });

  const topProducts = Object.values(productsData)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10);

  const totalRevenue = (topProducts as any[]).reduce((sum, product) => sum + product.revenue, 0);
  const totalItems = (topProducts as any[]).reduce((sum, product) => sum + product.quantity, 0);

  return {
    topProducts: topProducts as any[],
    totalRevenue,
    totalItems,
    productsRevenue: totalRevenue,
    productsSalesCount: totalItems
  };
}

async function generateClientsReport(supabase, userId: string, startDate: string, endDate: string): Promise<ReportMetrics> {
  // Fetch sales with client information
  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select('*, client:client_id(*)')
    .eq('user_id', userId)
    .gte('sale_date', startDate)
    .lte('sale_date', endDate)
    .not('client_id', 'is', null);

  if (salesError) {
    throw new Error(`Error fetching sales: ${salesError.message}`);
  }

  // Fetch appointments with pet and client information
  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*, pet:pet_id(*, client:client_id(*))')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (appointmentsError) {
    throw new Error(`Error fetching appointments: ${appointmentsError.message}`);
  }

  const clientsData = {};

  // Process sales data
  (salesData || []).forEach(sale => {
    if (!sale.client_id || !sale.client) return;
    
    if (!clientsData[sale.client_id]) {
      clientsData[sale.client_id] = {
        id: sale.client_id,
        name: sale.client.name,
        visits: 0,
        spent: 0
      };
    }
    
    clientsData[sale.client_id].visits += 1;
    clientsData[sale.client_id].spent += Number(sale.total || 0);
  });

  // Process appointments data
  (appointmentsData || []).forEach(appointment => {
    if (!appointment.pet || !appointment.pet.client_id || !appointment.pet.client) return;
    
    const clientId = appointment.pet.client_id;
    const clientName = appointment.pet.client.name;
    
    if (!clientsData[clientId]) {
      clientsData[clientId] = {
        id: clientId,
        name: clientName,
        visits: 0,
        spent: 0
      };
    }
    
    clientsData[clientId].visits += 1;
    
    // Add appointment price if it was completed
    if (appointment.status === 'completed' && appointment.service) {
      // Fetch service price
      const { data: serviceData } = await supabase
        .from('services')
        .select('price')
        .eq('id', appointment.service_id)
        .single();
        
      if (serviceData) {
        clientsData[clientId].spent += Number(serviceData.price || 0);
      }
    }
  });

  const topClients = Object.values(clientsData)
    .sort((a: any, b: any) => b.spent - a.spent)
    .slice(0, 10);

  const totalClients = Object.keys(clientsData).length;
  const totalVisits = Object.values(clientsData).reduce((sum: number, client: any) => sum + client.visits, 0);
  const totalSpent = Object.values(clientsData).reduce((sum: number, client: any) => sum + client.spent, 0);

  return {
    topClients: topClients as any[],
    totalClients,
    totalVisits,
    totalRevenue: totalSpent
  };
}

async function generateAppointmentsReport(supabase, userId: string, startDate: string, endDate: string): Promise<ReportMetrics> {
  // Fetch all appointments in the date range
  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .select(`
      *,
      pet:pet_id(*),
      service:service_id(*)
    `)
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (appointmentsError) {
    throw new Error(`Error fetching appointments: ${appointmentsError.message}`);
  }

  // Initialize metrics
  if (!appointmentsData || appointmentsData.length === 0) {
    return {
      appointmentsCount: 0,
      appointmentsRevenue: 0,
      appointmentsChart: []
    };
  }

  // Calculate revenue from completed appointments
  const completedAppointments = appointmentsData.filter(app => app.status === 'completed');
  const appointmentsRevenue = completedAppointments.reduce((sum, app) => {
    const price = app.service ? Number(app.service.price) : 0;
    return sum + price;
  }, 0);

  // Group appointments by date for chart
  const appointmentsByDate = appointmentsData.reduce((acc, app) => {
    if (!app.date) return acc;
    
    const dateStr = app.date.substring(0, 10);
    
    if (!acc[dateStr]) {
      acc[dateStr] = 0;
    }
    
    acc[dateStr] += 1;
    return acc;
  }, {});

  const appointmentsChart = Object.keys(appointmentsByDate).map((date) => ({
    date,
    count: appointmentsByDate[date],
  }));

  // Count appointments by status for pie chart
  const statusCounts = {};
  appointmentsData.forEach(app => {
    const status = app.status || 'pending';
    if (!statusCounts[status]) {
      statusCounts[status] = 0;
    }
    statusCounts[status] += 1;
  });

  // Translate status names to Portuguese
  const statusTranslations = {
    'pending': 'Pendente',
    'confirmed': 'Confirmado',
    'completed': 'Concluído',
    'cancelled': 'Cancelado',
    'no_show': 'Não Compareceu'
  };

  const appointmentStatusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusTranslations[status] || status,
    value: count as number
  }));

  return {
    appointmentsCount: appointmentsData.length,
    appointmentsRevenue,
    appointmentsChart,
    appointmentStatusData
  };
}
