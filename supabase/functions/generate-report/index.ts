import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, reportType, startDate, endDate, exportFormat } = await req.json();

    if (!userId || !reportType) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedStartDate = startDate ? new Date(startDate).toISOString() : null;
    const formattedEndDate = endDate ? new Date(endDate).toISOString() : null;

    console.log(
      `Generating ${reportType} report for user ${userId} from ${formattedStartDate} to ${formattedEndDate}`
    );

    // Default empty report structure
    const emptyReport = {
      totalRevenue: 0,
      servicesRevenue: 0,
      productsRevenue: 0,
      mixedRevenue: 0,
      appointmentsRevenue: 0,
      salesCount: 0,
      servicesSalesCount: 0,
      productsSalesCount: 0,
      mixedSalesCount: 0,
      appointmentsCount: 0,
      salesChart: [],
      exportFormat: exportFormat,
    };

    let reportData;
    let error;

    switch (reportType) {
      case "revenue":
        reportData = await generateRevenueReport(
          supabase, 
          userId, 
          formattedStartDate, 
          formattedEndDate
        );
        break;

      case "products":
        reportData = await generateProductsReport(
          supabase, 
          userId, 
          formattedStartDate, 
          formattedEndDate,
          exportFormat
        );
        break;

      case "services":
        reportData = await generateServicesReport(
          supabase, 
          userId, 
          formattedStartDate, 
          formattedEndDate,
          exportFormat
        );
        break;

      case "clients":
        reportData = await generateClientsReport(
          supabase, 
          userId, 
          formattedStartDate, 
          formattedEndDate,
          exportFormat
        );
        break;

      default:
        error = "Invalid report type";
    }

    if (error) {
      return new Response(
        JSON.stringify({ error }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Add export functionality if requested
    if (exportFormat && ["csv", "pdf", "excel", "xlsx"].includes(exportFormat)) {
      reportData = addExportData(reportData, reportType, exportFormat);
    }

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to fetch completed appointments revenue
async function fetchCompletedAppointmentsRevenue(supabase, userId, formattedStartDate, formattedEndDate) {
  try {
    // Get appointments with "completed" status
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id, date, time, service_id, user_id, status
      `)
      .eq("user_id", userId)
      .eq("status", "completed");

    if (appointmentsError) throw appointmentsError;

    if (!appointments || appointments.length === 0) {
      return { revenue: 0, count: 0, chart: [] };
    }

    const appointmentIds = appointments.map(appt => appt.id);
    
    // Check which appointments are already linked to sales
    const { data: salesWithAppointments } = await supabase
      .from("sales")
      .select("appointment_id")
      .eq("user_id", userId)
      .in("appointment_id", appointmentIds);
    
    const processedAppointmentIds = salesWithAppointments 
      ? salesWithAppointments.map(sale => sale.appointment_id)
      : [];
    
    // Filter out appointments that are already linked to sales
    const unprocessedAppointments = appointments.filter(
      appt => !processedAppointmentIds.includes(appt.id)
    );

    if (!unprocessedAppointments || unprocessedAppointments.length === 0) {
      return { revenue: 0, count: 0, chart: [] };
    }
    
    let revenue = 0;
    let chartByDay = {};
    
    for (const appt of unprocessedAppointments) {
      if (!appt.service_id) continue;
      
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("price")
        .eq("id", appt.service_id)
        .maybeSingle();
        
      if (!serviceError && service && service.price) {
        const price = Number(service.price);
        revenue += price;
        
        const apptDate = appt.date || null;
        if (apptDate) {
          const dateStr = new Date(apptDate).toISOString().split('T')[0];
          chartByDay[dateStr] = (chartByDay[dateStr] || 0) + price;
        }
      }
    }
    
    const chartArr = Object.entries(chartByDay).map(([date, value]) => ({
      date,
      value: Number(value),
    }));
    
    return {
      revenue,
      count: unprocessedAppointments.length,
      chart: chartArr,
    };
  } catch (error) {
    console.error("Error fetching completed appointments:", error);
    return { revenue: 0, count: 0, chart: [] };
  }
}

// Generate revenue report
async function generateRevenueReport(supabase, userId, formattedStartDate, formattedEndDate) {
  // Get sales data
  const { data: salesData, error: salesError } = await supabase
    .from("sales")
    .select("*")
    .eq("user_id", userId)
    .gte("sale_date", formattedStartDate)
    .lte("sale_date", formattedEndDate);

  if (salesError) throw salesError;

  // Get revenue from completed appointments not in sales
  const completedAppointments = await fetchCompletedAppointmentsRevenue(
    supabase, 
    userId, 
    formattedStartDate, 
    formattedEndDate
  );

  if ((!salesData || salesData.length === 0) && completedAppointments.count === 0) {
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

  const totalRevenue =
    (salesData || []).reduce((sum, sale) => sum + Number(sale.total || 0), 0) +
    completedAppointments.revenue;

  const servicesSales = (salesData || []).filter((sale) => sale.type === "service");
  const productsSales = (salesData || []).filter((sale) => sale.type === "product");

  const servicesRevenue = servicesSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const productsRevenue = productsSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

  const salesByDate = (salesData || []).reduce((acc, sale) => {
    if (!sale.sale_date) return acc;
    const date = sale.sale_date.split("T")[0];
    acc[date] = (acc[date] || 0) + Number(sale.total || 0);
    return acc;
  }, {});

  // Add appointment revenue to the chart
  (completedAppointments.chart || []).forEach(({ date, value }) => {
    salesByDate[date] = (salesByDate[date] || 0) + value;
  });

  const salesChart = Object.entries(salesByDate)
    .map(([date, value]) => ({
      date,
      value: Number(value),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

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

// Generate products report
async function generateProductsReport(supabase, userId, formattedStartDate, formattedEndDate, exportFormat) {
  const { data: saleItemsData, error: saleItemsError } = await supabase
    .from("sale_items")
    .select(`
      *,
      sales!inner(id,sale_date,user_id),
      products(name)
    `)
    .eq("sales.user_id", userId)
    .is("service_id", null)
    .not("product_id", "is", null)
    .gte("sales.sale_date", formattedStartDate)
    .lte("sales.sale_date", formattedEndDate);

  if (saleItemsError) throw saleItemsError;

  if (!saleItemsData || saleItemsData.length === 0) {
    return {
      topProducts: [],
      totalItems: 0,
      exportFormat
    };
  }

  const productSales = saleItemsData.reduce((acc, item) => {
    const productId = item.product_id;
    if (!productId) return acc;
    
    const productName = item.products?.name || "Produto desconhecido";
    
    if (!acc[productId]) {
      acc[productId] = {
        id: productId,
        name: productName,
        quantity: 0,
        revenue: 0
      };
    }
    
    acc[productId].quantity += item.quantity || 0;
    acc[productId].revenue += ((item.price || 0) * (item.quantity || 0));
    
    return acc;
  }, {});

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    topProducts,
    totalItems: saleItemsData.length,
    exportFormat
  };
}

// Generate services report
async function generateServicesReport(supabase, userId, formattedStartDate, formattedEndDate, exportFormat) {
  const { data: serviceItemsData, error: serviceItemsError } = await supabase
    .from("sale_items")
    .select(`
      *,
      sales!inner(id,sale_date,user_id),
      services(name)
    `)
    .eq("sales.user_id", userId)
    .is("product_id", null)
    .not("service_id", "is", null)
    .gte("sales.sale_date", formattedStartDate)
    .lte("sales.sale_date", formattedEndDate);

  if (serviceItemsError) throw serviceItemsError;

  // Fetch completed appointments for services report
  const { data: appointments, error: apptsError } = await supabase
    .from("appointments")
    .select(`
      id, service_id, date, 
      services(id, name, price)
    `)
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("date", formattedStartDate ? new Date(formattedStartDate).toISOString().split('T')[0] : null)
    .lte("date", formattedEndDate ? new Date(formattedEndDate).toISOString().split('T')[0] : null);

  if (apptsError) throw apptsError;
  
  // Filter out appointments that are already in sales
  const { data: salesWithAppointments } = await supabase
    .from("sales")
    .select("appointment_id")
    .eq("user_id", userId)
    .not("appointment_id", "is", null);
    
  const processedAppointmentIds = salesWithAppointments 
    ? salesWithAppointments.map(sale => sale.appointment_id)
    : [];
    
  const unprocessedAppointments = appointments 
    ? appointments.filter(appt => !processedAppointmentIds.includes(appt.id))
    : [];
  
  // Convert appointment services to the format needed for report
  const completedServiceItems = [];
  
  for (const appt of unprocessedAppointments) {
    if (!appt.service_id || !appt.services) continue;
    
    completedServiceItems.push({
      service_id: appt.service_id,
      services: { name: appt.services.name },
      quantity: 1,
      price: Number(appt.services.price || 0),
    });
  }

  // Combine service items from sales and completed appointments
  const allServiceItems = [...(serviceItemsData || []), ...completedServiceItems];

  if (allServiceItems.length === 0) {
    return {
      topServices: [],
      totalItems: 0,
      exportFormat
    };
  }

  const serviceSales = allServiceItems.reduce((acc, item) => {
    const serviceId = item.service_id;
    if (!serviceId) return acc;
    
    const serviceName = item.services?.name || "Serviço desconhecido";
    
    if (!acc[serviceId]) {
      acc[serviceId] = {
        id: serviceId,
        name: serviceName,
        quantity: 0,
        revenue: 0
      };
    }
    
    acc[serviceId].quantity += item.quantity || 1;
    acc[serviceId].revenue += ((item.price || 0) * (item.quantity || 1));
    
    return acc;
  }, {});

  const topServices = Object.values(serviceSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    topServices,
    totalItems: allServiceItems.length,
    exportFormat
  };
}

// Generate clients report
async function generateClientsReport(supabase, userId, formattedStartDate, formattedEndDate, exportFormat) {
  const { data: clientSalesData, error: clientSalesError } = await supabase
    .from("sales")
    .select(`
      *,
      clients(id, name)
    `)
    .eq("user_id", userId)
    .not("client_id", "is", null)
    .gte("sale_date", formattedStartDate)
    .lte("sale_date", formattedEndDate);

  if (clientSalesError) throw clientSalesError;

  const { data: clientAppts, error: clientApptsError } = await supabase
    .from("appointments")
    .select(`
      id, date, service_id, 
      pets(client_id),
      pets!inner(clients(id, name))
    `)
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("date", formattedStartDate ? new Date(formattedStartDate).toISOString().split('T')[0] : null)
    .lte("date", formattedEndDate ? new Date(formattedEndDate).toISOString().split('T')[0] : null);

  if (clientApptsError) throw clientApptsError;
  
  // Filter out appointments already in sales
  const { data: salesWithAppointments } = await supabase
    .from("sales")
    .select("appointment_id")
    .eq("user_id", userId)
    .not("appointment_id", "is", null);
    
  const processedAppointmentIds = salesWithAppointments 
    ? salesWithAppointments.map(sale => sale.appointment_id)
    : [];
    
  const unprocessedAppointments = clientAppts 
    ? clientAppts.filter(appt => !processedAppointmentIds.includes(appt.id))
    : [];

  // Calculate revenue for unprocessed appointments
  const clientApptsRevenue = [];
  
  for (const appt of unprocessedAppointments) {
    if (!appt.service_id || !appt.pets?.client_id) continue;
    
    const { data: service } = await supabase
      .from("services")
      .select("price")
      .eq("id", appt.service_id)
      .maybeSingle();
      
    if (service && service.price) {
      clientApptsRevenue.push({
        client_id: appt.pets.client_id,
        clients: appt.pets.clients,
        total: Number(service.price),
      });
    }
  }

  const allClientData = [...(clientSalesData || []), ...clientApptsRevenue];

  if (allClientData.length === 0) {
    return {
      topClients: [],
      totalClients: 0,
      totalVisits: 0,
      exportFormat
    };
  }

  const clientSpending = allClientData.reduce((acc, item) => {
    const clientId = item.client_id;
    if (!clientId || !item.clients) return acc;
    
    const clientName = item.clients?.name || "Cliente desconhecido";
    
    if (!acc[clientId]) {
      acc[clientId] = {
        id: clientId,
        name: clientName,
        visits: 0,
        spent: 0
      };
    }
    
    acc[clientId].visits++;
    acc[clientId].spent += Number(item.total || 0);
    
    return acc;
  }, {});

  const topClients = Object.values(clientSpending)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10);

  return {
    topClients,
    totalClients: Object.keys(clientSpending).length,
    totalVisits: allClientData.length,
    exportFormat
  };
}

// Add export data to report
function addExportData(reportData, reportType, exportFormat) {
  let fileName = "";
  let fileContent = "";

  switch (reportType) {
    case "revenue":
      fileName = `relatorio_faturamento.${exportFormat === "excel" ? "xlsx" : exportFormat}`;
      fileContent = "Data,Valor\n";
      (reportData.salesChart || []).forEach((item) => {
        fileContent += `${item.date},${item.value.toFixed(2).replace(".", ",")}\n`;
      });
      break;
    case "products":
      fileName = `relatorio_produtos.${exportFormat === "excel" ? "xlsx" : exportFormat}`;
      fileContent = "Produto,Quantidade,Faturamento\n";
      (reportData.topProducts || []).forEach((product) => {
        fileContent += `"${product.name}",${product.quantity},${product.revenue
          .toFixed(2)
          .replace(".", ",")}\n`;
      });
      break;
    case "services":
      fileName = `relatorio_servicos.${exportFormat === "excel" ? "xlsx" : exportFormat}`;
      fileContent = "Serviço,Quantidade,Faturamento\n";
      (reportData.topServices || []).forEach((service) => {
        fileContent += `"${service.name}",${service.quantity},${service.revenue
          .toFixed(2)
          .replace(".", ",")}\n`;
      });
      break;
    case "clients":
      fileName = `relatorio_clientes.${exportFormat === "excel" ? "xlsx" : exportFormat}`;
      fileContent = "Cliente,Visitas,Total Gasto\n";
      (reportData.topClients || []).forEach((client) => {
        fileContent += `"${client.name}",${client.visits},${client.spent
          .toFixed(2)
          .replace(".", ",")}\n`;
      });
      break;
  }

  reportData.exportedFile = btoa(unescape(encodeURIComponent(fileContent)));
  reportData.fileName = fileName;
  reportData.fileType =
    exportFormat === "pdf"
      ? "application/pdf"
      : exportFormat === "excel" || exportFormat === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv";
      
  return reportData;
}
