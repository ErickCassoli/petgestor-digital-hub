import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Clock, FileText, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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

// Function to format date for display
const formatDate = (date: Date) => {
  return format(date, "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });
};

// Function to format date for API
const formatDateForAPI = (date: Date) => {
  return format(date, "yyyy-MM-dd");
};

interface AppointmentDataFromDB {
  id: string;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  pets: { id: string; name: string; } | null;
  clients: { id: string; name: string; } | null;
  services: { id: string; name: string; } | null;
}

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigate to previous day
  const goToPreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  // Navigate to next day
  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  // Fetch appointments for the current date
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get appointments for the current date
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            date,
            time,
            status,
            notes,
            pets(id, name),
            clients(id, name),
            services(id, name)
          `)
          .eq('user_id', user.id)
          .eq('date', formatDateForAPI(currentDate));

        if (error) throw error;
        
        // Transform the data to match our Appointment interface
        const transformedData = (data as unknown as AppointmentDataFromDB[]).map(item => ({
          id: item.id,
          date: item.date,
          time: item.time,
          status: item.status as "pending" | "confirmed" | "cancelled" | "completed",
          notes: item.notes,
          pet: {
            id: item.pets?.id || "",
            name: item.pets?.name || ""
          },
          client: {
            id: item.clients?.id || "",
            name: item.clients?.name || ""
          },
          service: {
            id: item.services?.id || "",
            name: item.services?.name || ""
          }
        }));
        
        setAppointments(transformedData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar agendamentos",
          description: "Ocorreu um erro ao buscar os agendamentos."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, currentDate, toast]);

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
          <Button className="bg-petblue-600 hover:bg-petblue-700">
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
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd/MM/yyyy")
                  ) : (
                    <span>Escolha uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  onDayClick={(date) => {
                    setCurrentDate(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
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
                  <div>
                    <Badge className={statusBadgeStyles[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Appointments;
