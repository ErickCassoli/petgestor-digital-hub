// src/pages/appointments.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  User,
  Edit,
  Trash,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import AppointmentForm from "@/components/AppointmentForm";
import InvoiceForm from "@/components/InvoiceForm";
import ViewInvoice from "@/components/ViewInvoice";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClockDateDisplay from "@/components/dashboard/ClockDateDisplay";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const formatDate = (date: Date) =>
  format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
const formatDateForAPI = (date: Date) => format(date, "yyyy-MM-dd");

const statusBadgeStyles = {
  confirmed: "bg-green-500",
  pending: "bg-amber-500",
  cancelled: "bg-red-500",
  completed: "bg-blue-500",
};
const statusLabels = {
  confirmed: "Confirmado" as const,
  pending: "Pendente" as const,
  cancelled: "Cancelado" as const,
  completed: "Concluído" as const,
};

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string | null;
  pet: { id: string; name: string };
  client: { id: string; name: string };
  service: { id: string; name: string };
}

export default function Appointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const sb = supabase as any; // allow .from("invoices")

  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Appointment CRUD
  const [showForm, setShowForm] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState<Appointment | null>(null);

  // Invoice flow
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceAppt, setInvoiceAppt] = useState<Appointment | null>(null);
  const [showViewInvoice, setShowViewInvoice] = useState(false);
  const [invoiceToView, setInvoiceToView] = useState<any>(null);

  // Filters / controls
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Delete appointment
  const deleteAppointment = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este agendamento?")) return;
    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Agendamento removido", variant: "default" });
      fetchAppointments();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao deletar", description: e.message });
    }
  };

  // Pagination
  const goToPrevious = () => {
    if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subDays(currentDate, 7));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const goToNext = () => {
    if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Load services for filter dropdown
  async function fetchServices() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name")
        .eq("user_id", user.id);
      if (error) throw error;
      setServices(data || []);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro serviços", description: e.message });
    }
  }

  function getDateRange() {
    if (viewMode === "day") return [currentDate];
    if (viewMode === "week")
      return eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) });
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  }

  // Load appointments for the selected range & filter
  async function fetchAppointments() {
    if (!user) return;
    setLoading(true);
    try {
      const dates = getDateRange().map(formatDateForAPI);
      let q = supabase
        .from("appointments")
        .select("id, date, time, status, notes, pet_id, service_id")
        .eq("user_id", user.id)
        .in("date", dates as readonly string[])
        .order("time", { ascending: true });

      if (selectedServiceId && selectedServiceId !== "all") {
        q = q.eq("service_id", selectedServiceId);
      }

      const { data: raw, error } = await q;
      if (error) throw error;

      const formatted: Appointment[] = [];
      if (raw) {
        for (const a of raw) {
          // fetch pet, client, service names
          let petName = "—", clientName = "—", serviceName = "—", clientId = "";
          if (a.pet_id) {
            const petRes = await supabase
              .from("pets")
              .select("id, name, client_id")
              .eq("id", a.pet_id)
              .single();
            if (petRes.data) {
              petName = petRes.data.name;
              clientId = petRes.data.client_id;
              const cliRes = await supabase
                .from("clients")
                .select("name")
                .eq("id", clientId)
                .single();
              if (cliRes.data) clientName = cliRes.data.name;
            }
          }
          if (a.service_id) {
            const svcRes = await supabase
              .from("services")
              .select("name")
              .eq("id", a.service_id)
              .single();
            if (svcRes.data) serviceName = svcRes.data.name;
          }
          formatted.push({
            id: a.id,
            date: a.date,
            time: a.time,
            status: a.status as any,
            notes: a.notes,
            pet: { id: a.pet_id || "", name: petName },
            client: { id: clientId, name: clientName },
            service: { id: a.service_id || "", name: serviceName },
          });
        }
      }
      setAppointments(formatted);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro agendamentos", description: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchServices(); }, [user]);
  useEffect(() => { fetchAppointments(); }, [user, currentDate, viewMode, selectedServiceId, showForm]);

  const getForDate = (d: Date) => appointments.filter((a) => a.date === formatDateForAPI(d));

  // Load invoice for viewing
  const viewInvoice = async (appointmentId: string) => {
    try {
      const { data, error } = await sb
        .from("invoices")
        .select(`
          *,
          invoice_items (*, services(name))
        `)
        .eq("appointment_id", appointmentId)
        .single();
      if (error) throw error;
      setInvoiceToView(data);
      setShowViewInvoice(true);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro fatura", description: e.message });
    }
  };

  // Renderers for day, week, month…

  const renderDay = () => (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Agendamentos para {formatDate(currentDate)}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button size="icon" variant="outline" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[200px] justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(currentDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] max-w-[300px] p-0" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(d) => setCurrentDate(d || new Date())}
                className="p-3"
              />
            </PopoverContent>
          </Popover>
          <Button size="icon" variant="outline" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-0">
        {loading ? (
          <div className="p-6 flex justify-center items-center">
            <Clock className="animate-spin h-5 w-5 mr-2" /> Carregando...
          </div>
        ) : getForDate(currentDate).length === 0 ? (
          <div className="p-6 text-center">
            <CardDescription>Nenhum agendamento para este dia.</CardDescription>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {getForDate(currentDate).map((a) => (
              <div key={a.id} className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {a.client.name} – {a.pet.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    <Clock className="inline h-4 w-4 mr-1" />
                    {a.time} – {a.service.name}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={statusBadgeStyles[a.status]}>
                    {statusLabels[a.status]}
                  </Badge>
                  {a.status !== "completed" ? (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setInvoiceAppt(a);
                          setShowInvoiceForm(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedEdit(a);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => viewInvoice(a.id)}
                    >
                      <FileText className="h-4 w-4 text-petblue-600" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteAppointment(a.id)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderWeek = () => {
  const days = getDateRange();
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>
          Semana: {format(days[0], "dd/MM/yyyy")} – {format(days[days.length - 1], "dd/MM/yyyy")}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button size="icon" variant="outline" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[200px] justify-start text-left"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[90vw] max-w-[300px] p-0"
              align="center"
            >
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(d) => setCurrentDate(d || new Date())}
                className="p-3"
              />
            </PopoverContent>
          </Popover>
          <Button size="icon" variant="outline" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-0">
        {loading ? (
          <div className="p-6 flex justify-center items-center">
            <Clock className="animate-spin h-5 w-5 mr-2" /> Carregando...
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[700px] grid grid-cols-7 gap-2">
              {days.map((d) => {
                const dayAppts = getForDate(d);
                return (
                  <div
                    key={d.toISOString()}
                    className="border rounded p-2 flex flex-col"
                  >
                    <div
                      className={cn(
                        "text-center font-medium mb-2 p-1 rounded",
                        isSameDay(d, new Date()) && "bg-petblue-100"
                      )}
                    >
                      {format(d, "EEE", { locale: ptBR })}
                      <br />
                      {format(d, "dd/MM")}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {dayAppts.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center">
                          Nenhum
                        </div>
                      ) : (
                        dayAppts.map((a) => (
                          <div
                            key={a.id}
                            className="text-xs mb-2 p-1 rounded bg-gray-50 truncate whitespace-nowrap cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setSelectedEdit(a);
                              setShowForm(true);
                            }}
                          >
                            <span className="font-medium">{a.time}</span> –{" "}
                            {a.client.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const renderMonth = () => {
  const days = getDateRange();
  const weeks = Math.ceil(days.length / 7);
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button size="icon" variant="outline" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[200px] justify-start text-left"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[90vw] max-w-[300px] p-0"
              align="center"
            >
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(d) => setCurrentDate(d || new Date())}
                className="p-3"
              />
            </PopoverContent>
          </Popover>
          <Button size="icon" variant="outline" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-0">
        {loading ? (
          <div className="p-6 flex justify-center items-center">
            <Clock className="animate-spin h-5 w-5 mr-2" /> Carregando...
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[700px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                      (d) => (
                        <TableHead key={d}>{d}</TableHead>
                      )
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: weeks }).map((_, wi) => (
                    <TableRow key={wi}>
                      {Array.from({ length: 7 }).map((_, di) => {
                        const idx = wi * 7 + di;
                        const day = days[idx];
                        if (!day) return <TableCell key={di} />;
                        const dayAppts = getForDate(day);
                        return (
                          <TableCell key={di} className="align-top h-24">
                            <div
                              className={cn(
                                "font-medium truncate",
                                isSameDay(day, new Date()) &&
                                  "bg-petblue-100 p-1 rounded-full mx-auto w-6 h-6 flex items-center justify-center"
                              )}
                            >
                              {format(day, "d")}
                            </div>
                            {dayAppts.slice(0, 3).map((a) => (
                              <div
                                key={a.id}
                                className="text-xs truncate whitespace-nowrap mt-1 cursor-pointer hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedEdit(a);
                                  setShowForm(true);
                                }}
                              >
                                <span className="font-medium">{a.time}</span> –{" "}
                                {a.client.name}
                              </div>
                            ))}
                            {dayAppts.length > 3 && (
                              <div className="text-xs text-petblue-600">
                                +{dayAppts.length - 3} mais
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

  return (
    <>
      <div className="px-2">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Agendamentos
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie os agendamentos do seu petshop
            </p>
          </div>
          <ClockDateDisplay />
        </div>
        {/* Controles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <Tabs defaultValue="day" onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <Select defaultValue="all" onValueChange={(v) => setSelectedServiceId(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os serviços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { setSelectedEdit(null); setShowForm(true); }}>
              <FileText className="h-4 w-4 mr-2" /> Novo
            </Button>
          </div>
        </div>
        {/* Views */}
        {viewMode === "day" && renderDay()}
        {viewMode === "week" && renderWeek()}
        {viewMode === "month" && renderMonth()}
        {/* Appointment Form */}
        <AppointmentForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
          defaultValues={selectedEdit || undefined}
          supabase={supabase}
          user={user}
        />
      </div>

      {/* Invoice Form */}
      {invoiceAppt && (
        <InvoiceForm
          open={showInvoiceForm}
          appointment={invoiceAppt}
          supabase={supabase}
          user={user}
          onClose={() => setShowInvoiceForm(false)}
          onSuccess={() => {
            setShowInvoiceForm(false);
            fetchAppointments();
          }}
        />
      )}

      {/* View Invoice */}
      <ViewInvoice
        open={showViewInvoice}
        invoice={invoiceToView}
        onClose={() => setShowViewInvoice(false)}
      />
    </>
  );
}
