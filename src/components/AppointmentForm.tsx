import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultValues?: any;
  supabase: any;
  user: any;
}

const statusBadgeStyles = {
  confirmed: "bg-green-500",
  pending: "bg-amber-500",
  cancelled: "bg-red-500",
  completed: "bg-blue-500",
};

const AppointmentForm = ({ open, onClose, onSuccess, defaultValues, supabase, user }: Props) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(defaultValues?.date ? new Date(defaultValues.date) : new Date());
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [filteredPets, setFilteredPets] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      time: defaultValues?.time || "",
      petId: defaultValues?.pet?.id || "",
      clientId: defaultValues?.client?.id || "",
      serviceId: defaultValues?.service?.id || "",
      notes: defaultValues?.notes || "",
      status: defaultValues?.status || "pending"
    }
  });

  const selectedClientId = watch("clientId");

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      if (!user) return;
      setDataLoading(true);
      
      try {
        // Load clients
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name");
        
        if (clientsError) throw clientsError;
        setClients(clientsData || []);

        // Load all pets
        const { data: petsData, error: petsError } = await supabase
          .from("pets")
          .select("id, name, client_id")
          .eq("user_id", user.id)
          .order("name");
        
        if (petsError) throw petsError;
        setPets(petsData || []);

        // Load services
        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("id, name, price, description")
          .eq("user_id", user.id)
          .order("name");
        
        if (servicesError) throw servicesError;
        setServices(servicesData || []);
        
      } catch (error: any) {
        console.error("Error loading reference data:", error);
        toast({ 
          variant: "destructive", 
          title: "Erro ao carregar dados", 
          description: error.message 
        });
      } finally {
        setDataLoading(false);
      }
    };

    if (open) {
      loadReferenceData();
    }
  }, [user, open, supabase, toast]);

  // Filter pets when client changes
  useEffect(() => {
    if (selectedClientId) {
      setFilteredPets(pets.filter(pet => pet.client_id === selectedClientId));
    } else {
      setFilteredPets([]);
    }
  }, [selectedClientId, pets]);

  // Handle sync with defaultValues (for edit)
  useEffect(() => {
    if (defaultValues) {
      setValue("time", defaultValues.time || "");
      setDate(defaultValues.date ? new Date(defaultValues.date) : new Date());
      setValue("petId", defaultValues.pet?.id || "");
      setValue("clientId", defaultValues.client?.id || "");
      setValue("serviceId", defaultValues.service?.id || "");
      setValue("notes", defaultValues.notes || "");
      setValue("status", defaultValues.status || "pending");
    }
  }, [defaultValues, setValue]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Validation checks
      if (!values.petId || !values.serviceId || !values.time) {
        toast({ 
          variant: "destructive", 
          title: "Campos obrigatórios", 
          description: "Preencha todos os campos obrigatórios." 
        });
        setLoading(false);
        return;
      }

      // 2. Insert or Update
      if (defaultValues?.id) {
        // Update
        const { error } = await supabase
          .from("appointments")
          .update({
            date: format(date, "yyyy-MM-dd"),
            time: values.time,
            pet_id: values.petId,
            service_id: values.serviceId,
            status: values.status,
            notes: values.notes,
          })
          .eq("id", defaultValues.id)
          .eq("user_id", user.id);
        
        if (error) throw error;
        toast({ title: "Agendamento atualizado com sucesso!" });
      } else {
        // Insert
        const { error } = await supabase.from("appointments").insert([{
          date: format(date, "yyyy-MM-dd"),
          time: values.time,
          pet_id: values.petId,
          service_id: values.serviceId,
          status: values.status,
          notes: values.notes,
          user_id: user.id,
        }]);
        
        if (error) throw error;
        toast({ title: "Agendamento criado com sucesso!" });
      }
      
      reset();
      onSuccess();
      onClose();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao salvar.", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-rose-500"
          onClick={onClose}
          type="button"
          aria-label="Fechar"
        >
          <X className="h-6 w-6" />
        </button>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <h2 className="text-xl font-bold mb-2">{defaultValues?.id ? "Editar Agendamento" : "Novo Agendamento"}</h2>
          
          {dataLoading ? (
            <div className="text-center py-4">Carregando dados...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm mb-1">Cliente</label>
                <select 
                  className="input w-full" 
                  {...register("clientId")}
                  disabled={loading}
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Pet</label>
                <select 
                  className="input w-full" 
                  {...register("petId")}
                  disabled={!selectedClientId || loading}
                >
                  <option value="">Selecione um pet</option>
                  {filteredPets.map(pet => (
                    <option key={pet.id} value={pet.id}>{pet.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Serviço</label>
                <select 
                  className="input w-full" 
                  {...register("serviceId")}
                  disabled={loading}
                >
                  <option value="">Selecione um serviço</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - R$ {service.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                      type="button"
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => setDate(newDate || new Date())}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Hora</label>
                <input 
                  className="input w-full" 
                  type="time" 
                  {...register("time")} 
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Status</label>
                <select 
                  className="input w-full" 
                  {...register("status")}
                  disabled={loading}
                >
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Observações</label>
                <textarea 
                  className="input w-full" 
                  {...register("notes")} 
                  rows={2}
                  disabled={loading}
                />
              </div>
              
              <div className="flex item-center gap-2 mt-4">
                <Button 
                  type="submit" 
                  className="bg-petblue-600 text-white" 
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
