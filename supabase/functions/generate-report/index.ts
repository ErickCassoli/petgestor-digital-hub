
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
  topProducts?: { id: string; name: string; quantity: number; revenue: number }[];
  topServices?: { id: string; name: string; quantity: number; revenue: number }[];
  topClients?: { id: string; name: string; visits: number; spent: number }[];
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
      totalRevenue: 0,
      servicesRevenue: 0,
      productsRevenue: 0,
      appointmentsRevenue: 0,
      salesCount: 0,
      servicesSalesCount: 0,
      productsSalesCount: 0,
      appointmentsCount: 0,
      salesChart: [],
    };
  }

  // Calculate total revenue from sales directly using the total field
  const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.total || 0), 0) + completedAppointments.revenue;

  const servicesSales = (salesData || []).filter((sale) => sale.type === "service");
  const productsSales = (salesData || []).filter((sale) => sale.type === "product");

  const servicesRevenue = servicesSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const productsRevenue = productsSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

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
    servicesSalesCount: servicesSales.length,
    productsSalesCount: productsSales.length,
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
    .eq('sales.type', 'service')
    .not('service_id', 'is', null);

  if (saleItemsError) {
    throw new Error(`Error fetching service sales: ${saleItemsError.message}`);
  }

  const servicesData = {};
  
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

  const topServices = Object.values(servicesData)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    topServices: topServices as any[],
    totalRevenue: (topServices as any[]).reduce((sum, service) => sum + service.revenue, 0),
    totalItems: (topServices as any[]).reduce((sum, service) => sum + service.quantity, 0)
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
    .eq('sales.type', 'product')
    .not('product_id', 'is', null);

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

  return {
    topProducts: topProducts as any[],
    totalRevenue: (topProducts as any[]).reduce((sum, product) => sum + product.revenue, 0),
    totalItems: (topProducts as any[]).reduce((sum, product) => sum + product.quantity, 0)
  };
}
