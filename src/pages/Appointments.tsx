
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  FileText, 
  User, 
  X, 
  Edit, 
  Trash, 
  Filter 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import AppointmentForm from "@/components/AppointmentForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ClockDateDisplay from "@/components/dashboard/ClockDateDisplay";

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string | null;
  pet: {
    id: string;
    name: string;
  };
  client: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
  };
}

interface Service {
  id: string;
  name: string;
}

const formatDate = (date: Date) => {
  return format(date, "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });
};

const formatDateShort = (date: Date) => {
  return format(date, "dd/MM", {
    locale: ptBR,
  });
};

const formatDateForAPI = (date: Date) => {
  return format(date, "yyyy-MM-dd");
};

const statusBadgeStyles = {
  confirmed: "bg-green-500",
  pending: "bg-amber-500",
  cancelled: "bg-red-500",
  completed: "bg-blue-500",
};

const statusLabels = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
  completed: "Concluído",
};

const Appointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const goToPreviousDay = () => {
    if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subDays(currentDate, 7));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextDay = () => {
    if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const fetchServices = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('user_id', user.id);

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      toast({ variant: "destructive", title: "Erro ao carregar serviços", description: error?.message });
    }
  };

  const getDateRangeForView = () => {
    if (viewMode === "day") {
      return [currentDate];
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const fetchAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dateRange = getDateRangeForView();
      const formattedDates = dateRange.map(date => formatDateForAPI(date));
      
      let query = supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          notes,
          pet_id,
          service_id
        `)
        .eq('user_id', user.id)
        .in('date', formattedDates)
        .order("time", { ascending: true });
      
      if (selectedServiceId) {
        query = query.eq('service_id', selectedServiceId);
      }
      
      let { data: appointmentsData, error } = await query;

      if (error) throw error;

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const formattedAppointments: Appointment[] = [];
      
      for (const appointment of appointmentsData) {
        let petName = 'Sem informação';
        let clientName = 'Sem informação';
        let serviceName = 'Sem informação';
        let clientId = '';

        if (appointment.pet_id) {
          const { data: petData, error: petError } = await supabase
            .from('pets')
            .select('id, name, client_id')
            .eq('id', appointment.pet_id)
            .single();
            
          if (petData) {
            petName = petData.name;
            clientId = petData.client_id;
            
            // Get client name using the client_id from pet
            const { data: clientData, error: clientError } = await supabase
              .from('clients')
              .select('id, name')
              .eq('id', clientId)
              .single();
              
            if (clientData) {
              clientName = clientData.name;
              clientId = clientData.id;
            }
          }
        }
        
        if (appointment.service_id) {
          const { data: serviceData, error: serviceError } = await supabase
            .from('services')
            .select('id, name')
            .eq('id', appointment.service_id)
            .single();
            
          if (serviceData) serviceName = serviceData.name;
        }

        formattedAppointments.push({
          id: appointment.id,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status as "pending" | "confirmed" | "cancelled" | "completed",
          notes: appointment.notes,
          pet: { 
            id: appointment.pet_id || "", 
            name: petName
          },
          client: { 
            id: clientId, 
            name: clientName
          },
          service: { 
            id: appointment.service_id || "", 
            name: serviceName
          }
        });
      }

      setAppointments(formattedAppointments);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast({ variant: "destructive", title: "Erro ao carregar agendamentos", description: error?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [user, currentDate, toast, showForm, viewMode, selectedServiceId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esse agendamento?")) return;
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Agendamento excluído com sucesso!" });
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: e.message });
    }
  };

  const startEdit = (appt: Appointment) => {
    setSelectedEdit(appt);
    setShowForm(true);
  };

  const getAppointmentsForDate = (date: Date) => {
    const formattedDate = formatDateForAPI(date);
    return appointments.filter(appointment => appointment.date === formattedDate);
  };

  const renderDayView = () => (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Agendamentos para {formatDate(currentDate)}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !currentDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(currentDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  setCurrentDate(date ?? new Date());
                  setCalendarOpen(false);
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 flex justify-center items-center">
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            Carregando agendamentos...
          </div>
        ) : getAppointmentsForDate(currentDate).length === 0 ? (
          <div className="p-6 text-center">
            <CardDescription className="text-gray-500">
              Nenhum agendamento para este dia.
            </CardDescription>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {getAppointmentsForDate(currentDate).map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {appointment.client.name} - {appointment.pet.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    <Clock className="inline-block h-4 w-4 mr-1" />
                    {appointment.time} - {appointment.service.name}
                  </div>
                  {appointment.notes && (
                    <div className="text-xs text-gray-600 mt-1">
                      <User className="inline-block h-3 w-3 mr-1" />
                      {appointment.notes}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <Badge className={statusBadgeStyles[appointment.status]}>
                    {statusLabels[appointment.status]}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Editar"
                    onClick={() => startEdit(appointment)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Excluir"
                    onClick={() => handleDelete(appointment.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderWeekView = () => {
    const dateRange = getDateRangeForView();
    
    return (
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>
            Semana: {format(dateRange[0], "dd/MM/yyyy")} - {format(dateRange[dateRange.length - 1], "dd/MM/yyyy")}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !currentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => {
                    setCurrentDate(date ?? new Date());
                    setCalendarOpen(false);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 flex justify-center items-center">
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Carregando agendamentos...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {dateRange.map((date, index) => (
                <div key={index} className="border rounded-md p-2">
                  <div className={cn(
                    "text-center font-medium mb-2 p-1 rounded-md",
                    isSameDay(date, new Date()) && "bg-petblue-100"
                  )}>
                    {format(date, "EEE", { locale: ptBR })}
                    <br />
                    {format(date, "dd/MM")}
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {getAppointmentsForDate(date).length === 0 ? (
                      <div className="text-center text-xs text-gray-400 py-2">
                        Nenhum agendamento
                      </div>
                    ) : (
                      getAppointmentsForDate(date).map(appt => (
                        <div key={appt.id} className="text-xs mb-2 p-1 rounded bg-gray-50">
                          <div className="font-medium">{appt.time} - {appt.client.name}</div>
                          <div>{appt.service.name}</div>
                          <div className="flex justify-between mt-1">
                            <Badge className={cn("text-xs px-1 py-0", statusBadgeStyles[appt.status])}>
                              {statusLabels[appt.status]}
                            </Badge>
                            <div className="flex">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-4 w-4 p-0" 
                                onClick={() => startEdit(appt)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-4 w-4 p-0" 
                                onClick={() => handleDelete(appt.id)}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderMonthView = () => {
    const dateRange = getDateRangeForView();
    
    return (
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !currentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => {
                    setCurrentDate(date ?? new Date());
                    setCalendarOpen(false);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 flex justify-center items-center">
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Carregando agendamentos...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dom</TableHead>
                  <TableHead>Seg</TableHead>
                  <TableHead>Ter</TableHead>
                  <TableHead>Qua</TableHead>
                  <TableHead>Qui</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Sáb</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: Math.ceil(dateRange.length / 7) }).map((_, weekIndex) => (
                  <TableRow key={weekIndex}>
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const dayNum = weekIndex * 7 + dayIndex;
                      const date = dayNum < dateRange.length ? dateRange[dayNum] : null;
                      
                      if (!date) return <TableCell key={dayIndex} />;
                      
                      const dayAppointments = getAppointmentsForDate(date);
                      const appointmentCount = dayAppointments.length;
                      
                      return (
                        <TableCell key={dayIndex} className="h-24 align-top">
                          <div className={cn(
                            "font-medium",
                            isSameDay(date, new Date()) && "bg-petblue-100 p-1 rounded-full w-6 h-6 flex items-center justify-center mx-auto mb-1"
                          )}>
                            {format(date, "d")}
                          </div>
                          {appointmentCount > 0 ? (
                            <div>
                              {dayAppointments.slice(0, 3).map((appt) => (
                                <div 
                                  key={appt.id} 
                                  className="text-xs mb-1 p-1 rounded truncate cursor-pointer hover:bg-gray-100"
                                  onClick={() => startEdit(appt)}
                                >
                                  <span className="font-medium">{appt.time}</span> {appt.client.name.substring(0, 10)}...
                                </div>
                              ))}
                              {appointmentCount > 3 && (
                                <div className="text-xs text-center text-petblue-600">
                                  +{appointmentCount - 3} mais
                                </div>
                              )}
                            </div>
                          ) : null}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os agendamentos do seu petshop
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <ClockDateDisplay />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <Tabs 
          defaultValue="day" 
          className="w-full sm:w-auto"
          onValueChange={(value) => setViewMode(value as "day" | "week" | "month")}
        >
          <TabsList>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Select onValueChange={(value) => setSelectedServiceId(value || null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por serviço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os serviços</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button className="bg-petblue-600 hover:bg-petblue-700" onClick={() => { setSelectedEdit(null); setShowForm(true); }}>
            <FileText className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {viewMode === "day" && renderDayView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "month" && renderMonthView()}

      <AppointmentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => setShowForm(false)}
        defaultValues={selectedEdit || undefined}
        supabase={supabase}
        user={user}
      />
    </div>
  );
};

export default Appointments;
