
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Appointments = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Format date as DD/MM/YYYY
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR');
  };
  
  // Get day of week in Portuguese
  const getDayOfWeek = (date: Date): string => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[date.getDay()];
  };
  
  // Handle navigation between days
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
  };

  // Mock appointments data
  const appointments = [
    {
      id: "1",
      time: "09:00",
      pet: "Max",
      owner: "João Silva",
      service: "Banho e Tosa",
      status: "confirmed"
    },
    {
      id: "2",
      time: "10:30",
      pet: "Luna",
      owner: "Maria Oliveira",
      service: "Consulta Veterinária",
      status: "confirmed"
    },
    {
      id: "3",
      time: "11:45",
      pet: "Rex",
      owner: "Carlos Santos",
      service: "Banho",
      status: "pending"
    },
    {
      id: "4",
      time: "14:00",
      pet: "Mia",
      owner: "Ana Costa",
      service: "Vacina",
      status: "confirmed"
    },
    {
      id: "5",
      time: "15:30",
      pet: "Thor",
      owner: "Lucas Ferreira",
      service: "Tosa",
      status: "cancelled"
    },
    {
      id: "6",
      time: "16:45",
      pet: "Nina",
      owner: "Paula Souza",
      service: "Banho e Tosa",
      status: "confirmed"
    }
  ];

  // Map status to badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmado</Badge>;
      case "pending":
        return <Badge className="bg-amber-500">Pendente</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelado</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
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
        {/* Calendar sidebar - would be replaced with a proper calendar component */}
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
                Abril 2023
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
          </CardContent>
        </Card>

        {/* Appointments for the selected day */}
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigateDay('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center mx-2">
                  <CardTitle>
                    {getDayOfWeek(currentDate)}, {formatDate(currentDate)}
                  </CardTitle>
                  <CardDescription>
                    {appointments.length} agendamentos
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
              <div className="flex space-x-2">
                <Badge className="bg-green-500">Confirmado</Badge>
                <Badge className="bg-amber-500">Pendente</Badge>
                <Badge className="bg-red-500">Cancelado</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">Nenhum agendamento para esta data</p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar agendamento
                  </Button>
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div 
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="text-lg font-medium text-gray-900 w-16">
                        {appointment.time}
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">
                          {appointment.pet} ({appointment.owner})
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.service}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(appointment.status)}
                      <Button variant="ghost" size="sm">
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Appointments;
