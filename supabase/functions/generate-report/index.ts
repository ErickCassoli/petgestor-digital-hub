
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

    let reportData;
    let error;

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

    async function fetchDoneAppointmentsRevenue() {
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          id, date, time, service_id, user_id, status
        `)
        .eq("user_id", userId)
        .eq("status", "completed")
        .not(
          "id",
          "in",
          supabase
            .from("sales")
            .select("appointment_id")
            .eq("user_id", userId)
            .gte("sale_date", formattedStartDate)
            .lte("sale_date", formattedEndDate)
        );

      if (appointmentsError) throw appointmentsError;

      if (!appointments || appointments.length === 0) return { revenue: 0, count: 0, chart: [] };

      let revenue = 0;
      let chartByDay = {};
      for (const appt of appointments) {
        if (!appt.service_id) continue;
        const { data: service, error: serviceError } = await supabase
          .from("services")
          .select("price")
          .eq("id", appt.service_id)
          .maybeSingle();
        if (!serviceError && service && service.price) {
          revenue += Number(service.price);
          const apptDate = appt.date ? appt.date : null;
          if (apptDate) {
            chartByDay[apptDate] = (chartByDay[apptDate] || 0) + Number(service.price);
          }
        }
      }
      const chartArr = Object.entries(chartByDay).map(([date, value]) => ({
        date,
        value: Number(value),
      }));
      return {
        revenue,
        count: appointments.length,
        chart: chartArr,
      };
    }

    switch (reportType) {
      case "revenue":
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("user_id", userId)
          .gte("sale_date", formattedStartDate)
          .lte("sale_date", formattedEndDate);

        if (salesError) throw salesError;

        const doneAppointments = await fetchDoneAppointmentsRevenue();

        if ((!salesData || salesData.length === 0) && doneAppointments.count === 0) {
          reportData = emptyReport;
          break;
        }

        const totalRevenue =
          (salesData || []).reduce((sum, sale) => sum + Number(sale.total || 0), 0) +
          doneAppointments.revenue;

        const servicesSales = (salesData || []).filter((sale) => sale.type === "service");
        const productsSales = (salesData || []).filter((sale) => sale.type === "product");
        const mixedSales = (salesData || []).filter((sale) => sale.type === "both");

        const servicesRevenue = servicesSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
        const productsRevenue = productsSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
        const mixedRevenue = mixedSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

        const salesByDate = (salesData || []).reduce((acc, sale) => {
          if (!sale.sale_date) return acc;
          const date = sale.sale_date.split("T")[0];
          acc[date] = (acc[date] || 0) + Number(sale.total || 0);
          return acc;
        }, {});

        (doneAppointments.chart || []).forEach(({ date, value }) => {
          salesByDate[date] = (salesByDate[date] || 0) + value;
        });

        const salesChart = Object.entries(salesByDate)
          .map(([date, value]) => ({
            date,
            value: Number(value),
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        reportData = {
          totalRevenue,
          servicesRevenue,
          productsRevenue,
          mixedRevenue,
          appointmentsRevenue: doneAppointments.revenue,
          salesCount: (salesData || []).length,
          appointmentsCount: doneAppointments.count,
          servicesSalesCount: servicesSales.length,
          productsSalesCount: productsSales.length,
          mixedSalesCount: mixedSales.length,
          salesChart,
          exportFormat,
        };
        break;

      case "products":
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
          reportData = {
            topProducts: [],
            totalItems: 0,
            exportFormat
          };
          break;
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

        reportData = {
          topProducts,
          totalItems: saleItemsData.length,
          exportFormat
        };
        break;

      case "services":
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

        if (!serviceItemsData || serviceItemsData.length === 0) {
          reportData = {
            topServices: [],
            totalItems: 0,
            exportFormat
          };
          break;
        }

        const serviceSales = serviceItemsData.reduce((acc, item) => {
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
          
          acc[serviceId].quantity += item.quantity || 0;
          acc[serviceId].revenue += ((item.price || 0) * (item.quantity || 0));
          
          return acc;
        }, {});

        const topServices = Object.values(serviceSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10);

        reportData = {
          topServices,
          totalItems: serviceItemsData.length,
          exportFormat
        };
        break;

      case "clients":
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

        if (!clientSalesData || clientSalesData.length === 0) {
          reportData = {
            topClients: [],
            totalClients: 0,
            totalVisits: 0,
            exportFormat
          };
          break;
        }

        const clientSpending = clientSalesData.reduce((acc, sale) => {
          const clientId = sale.client_id;
          if (!clientId || !sale.clients) return acc;
          
          const clientName = sale.clients?.name || "Cliente desconhecido";
          
          if (!acc[clientId]) {
            acc[clientId] = {
              id: clientId,
              name: clientName,
              visits: 0,
              spent: 0
            };
          }
          
          acc[clientId].visits++;
          acc[clientId].spent += Number(sale.total || 0);
          
          return acc;
        }, {});

        const topClients = Object.values(clientSpending)
          .sort((a, b) => b.spent - a.spent)
          .slice(0, 10);

        reportData = {
          topClients,
          totalClients: Object.keys(clientSpending).length,
          totalVisits: clientSalesData.length,
          exportFormat
        };
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

    if (["csv", "pdf", "excel", "xlsx"].includes(exportFormat)) {
      let fileName = "";
      let fileContent;

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
