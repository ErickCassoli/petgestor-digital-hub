
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Clock, FileText, User, X, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import AppointmentForm from "@/components/AppointmentForm";

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

const formatDate = (date: Date) => {
  return format(date, "EEEE, d 'de' MMMM", {
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

  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fixed query to use proper joins
        let { data, error } = await supabase
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
          .eq('date', formatDateForAPI(currentDate))
          .order("time", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          setAppointments([]);
          setLoading(false);
          return;
        }

        // Get all pet IDs to fetch pet info
        const petIds = data.map(item => item.pet_id);
        const { data: petsData, error: petsError } = await supabase
          .from('pets')
          .select('id, name, client_id')
          .in('id', petIds);

        if (petsError) throw petsError;

        // Get all client IDs to fetch client info
        const clientIds = petsData?.map(pet => pet.client_id) || [];
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds);

        if (clientsError) throw clientsError;

        // Get all service IDs to fetch service info
        const serviceIds = data.map(item => item.service_id);
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name')
          .in('id', serviceIds);

        if (servicesError) throw servicesError;

        // Map data to combine all related information
        const transformedData = data.map(item => {
          const pet = petsData?.find(p => p.id === item.pet_id);
          const client = clientsData?.find(c => c.id === pet?.client_id);
          const service = servicesData?.find(s => s.id === item.service_id);

          return {
            id: item.id,
            date: item.date,
            time: item.time,
            status: item.status as "pending" | "confirmed" | "cancelled" | "completed",
            notes: item.notes,
            pet: { 
              id: pet?.id || "", 
              name: pet?.name || "Pet não encontrado" 
            },
            client: { 
              id: client?.id || "", 
              name: client?.name || "Cliente não encontrado" 
            },
            service: { 
              id: service?.id || "", 
              name: service?.name || "Serviço não encontrado" 
            }
          };
        });

        setAppointments(transformedData);
      } catch (error: any) {
        console.error("Error fetching appointments:", error);
        toast({ variant: "destructive", title: "Erro ao carregar agendamentos", description: error?.message });
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [user, currentDate, toast, showForm]);

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os agendamentos do seu petshop
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button className="bg-petblue-600 hover:bg-petblue-700" onClick={() => { setSelectedEdit(null); setShowForm(true); }}>
            <FileText className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

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
                  variant={"outline"}
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
          ) : appointments.length === 0 ? (
            <div className="p-6 text-center">
              <CardDescription className="text-gray-500">
                Nenhum agendamento para este dia.
              </CardDescription>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {appointments.map((appointment) => (
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
