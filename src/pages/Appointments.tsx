
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
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

const statusBadgeStyles = {
  confirmed: "bg-green-500",
  pending: "bg-amber-500",
  cancelled: "bg-red-500",
  completed: "bg-blue-500"
};

const statusLabels = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
  completed: "Concluído"
};

const Appointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Format date as YYYY-MM-DD for API calls
  const formatDateForAPI = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };
  
  // Handle navigation between days
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
    setCurrentDate(newDate);
  };

  // Fetch appointments for the current date
  useEffect(() => {
    if (!user) return;
    
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('appointments')
          .select(`
            id,
            date,
            time,
            status,
            notes,
            pets:pet_id (id, name),
            clients!inner (id, name),
            services:service_id (id, name)
          `)
          .eq('user_id', user.id)
          .eq('date', formatDateForAPI(currentDate));
        
        if (statusFilter !== "all") {
          query = query.eq('status', statusFilter);
        }
        
        const { data, error } = await query.order('time');
        
        if (error) throw error;
        
        // Transform the data to match our Appointment interface
        const transformedData = data.map(item => ({
          id: item.id,
          date: item.date,
          time: item.time,
          status: item.status as "pending" | "confirmed" | "cancelled" | "completed",
          notes: item.notes,
          pet: {
            id: item.pets.id,
            name: item.pets.name
          },
          client: {
            id: item.clients.id,
            name: item.clients.name
          },
          service: {
            id: item.services.id,
            name: item.services.name
          }
        }));
        
        setAppointments(transformedData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os agendamentos."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user, currentDate, statusFilter]);

  // Filter appointments by search term
  const filteredAppointments = appointments.filter(appointment => 
    appointment.pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get day of week in Portuguese
  const getDayOfWeek = (date: Date): string => {
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  // Placeholder for handle status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setAppointments(prevAppointments => 
        prevAppointments.map(appt => 
          appt.id === id 
            ? { ...appt, status: newStatus as "pending" | "confirmed" | "cancelled" | "completed" } 
            : appt
        )
      );
      
      toast({
        title: "Status atualizado",
        description: `Agendamento alterado para "${statusLabels[newStatus as keyof typeof statusLabels]}".`
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do agendamento."
      });
    }
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
          <Button className="bg-petblue-600 hover:bg-petblue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Calendar sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 mb-4">
              Esta é uma visualização simplificada. Em uma implementação completa, teríamos um calendário interativo.
            </p>
            <div className="text-center p-4 border rounded-lg">
              <div className="font-medium text-lg text-gray-900">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </div>
              <div className="grid grid-cols-7 gap-1 mt-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                  <div key={index} className="text-xs text-gray-500">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 30 }).map((_, index) => (
                  <div 
                    key={index}
                    className={`text-sm p-1 rounded-full 
                      ${index + 1 === currentDate.getDate() ? 
                        'bg-petblue-600 text-white' : 
                        'hover:bg-gray-100 cursor-pointer'}`}
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setDate(index + 1);
                      setCurrentDate(newDate);
                    }}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appointments for the selected day */}
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigateDay('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center mx-2">
                  <CardTitle className="capitalize">
                    {getDayOfWeek(currentDate)}
                  </CardTitle>
                  <CardDescription>
                    {loading ? "Carregando..." : `${filteredAppointments.length} agendamentos`}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigateDay('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search box */}
              <div className="w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar pet, cliente ou serviço..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Status badge legend */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="bg-green-500">Confirmado</Badge>
              <Badge className="bg-amber-500">Pendente</Badge>
              <Badge className="bg-blue-500">Concluído</Badge>
              <Badge className="bg-red-500">Cancelado</Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-2 text-gray-500">Nenhum agendamento para esta data</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar agendamento
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div 
                    key={appointment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start sm:items-center mb-3 sm:mb-0">
                      <div className="text-lg font-medium text-gray-900 w-16">
                        {appointment.time.substring(0, 5)}
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">
                          {appointment.pet.name} ({appointment.client.name})
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.service.name}
                        </p>
                        {appointment.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            Obs: {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <Badge className={statusBadgeStyles[appointment.status]}>
                        {statusLabels[appointment.status]}
                      </Badge>
                      
                      <Select
                        defaultValue={appointment.status}
                        onValueChange={(value) => handleStatusChange(appointment.id, value)}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue placeholder="Alterar status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmar</SelectItem>
                          <SelectItem value="completed">Concluir</SelectItem>
                          <SelectItem value="cancelled">Cancelar</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Appointments;
