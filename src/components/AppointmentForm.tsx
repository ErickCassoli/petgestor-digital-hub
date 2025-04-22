
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

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      time: defaultValues?.time || "",
      petName: defaultValues?.pet?.name || "",
      clientName: defaultValues?.client?.name || "",
      serviceName: defaultValues?.service?.name || "",
      notes: defaultValues?.notes || "",
      status: defaultValues?.status || "pending"
    }
  });

  // Handle sync with defaultValues (for edit)
  useEffect(() => {
    if (defaultValues) {
      setValue("time", defaultValues.time || "");
      setDate(defaultValues.date ? new Date(defaultValues.date) : new Date());
      setValue("petName", defaultValues.pet?.name || "");
      setValue("clientName", defaultValues.client?.name || "");
      setValue("serviceName", defaultValues.service?.name || "");
      setValue("notes", defaultValues.notes || "");
      setValue("status", defaultValues.status || "pending");
    }
  }, [defaultValues, setValue]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 1. Buscar IDs relacionados (pet, client, service)
      let petId, clientId, serviceId;

      // Pet
      if (values.petName) {
        const { data: petData } = await supabase
          .from("pets")
          .select("id")
          .eq("name", values.petName)
          .eq("user_id", user.id)
          .maybeSingle();
        petId = petData?.id;
      }
      // Client
      if (values.clientName) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("name", values.clientName)
          .eq("user_id", user.id)
          .maybeSingle();
        clientId = clientData?.id;
      }
      // Service
      if (values.serviceName) {
        const { data: serviceData } = await supabase
          .from("services")
          .select("id")
          .eq("name", values.serviceName)
          .eq("user_id", user.id)
          .maybeSingle();
        serviceId = serviceData?.id;
      }

      // Validação rápida
      if (!petId || !clientId || !serviceId || !values.time) {
        toast({ variant: "destructive", title: "Campos obrigatórios", description: "Preencha todos os campos corretamente." });
        setLoading(false);
        return;
      }

      // 2. Inserir ou Atualizar
      if (defaultValues?.id) {
        // Update
        const { error } = await supabase
          .from("appointments")
          .update({
            date: format(date, "yyyy-MM-dd"),
            time: values.time,
            pet_id: petId,
            service_id: serviceId,
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
          pet_id: petId,
          service_id: serviceId,
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
          <div>
            <label className="block text-sm mb-1">Cliente</label>
            <input className="input w-full" placeholder="Nome do cliente" {...register("clientName", { required: true })} />
          </div>
          <div>
            <label className="block text-sm mb-1">Pet</label>
            <input className="input w-full" placeholder="Nome do pet" {...register("petName", { required: true })} />
          </div>
          <div>
            <label className="block text-sm mb-1">Serviço</label>
            <input className="input w-full" placeholder="Nome do serviço" {...register("serviceName", { required: true })} />
          </div>
          <div>
            <label className="block text-sm mb-1">Data</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="block text-sm mb-1">Hora</label>
            <input className="input w-full" type="time" {...register("time", { required: true })} />
          </div>
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select className="input w-full" {...register("status")}>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="cancelled">Cancelado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Observações</label>
            <textarea className="input w-full" {...register("notes")} rows={2} />
          </div>
          <div className="flex item-center gap-2 mt-4">
            <Button type="submit" className="bg-petblue-600 text-white" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
