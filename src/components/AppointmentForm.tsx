import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultValues?: any;
  supabase: any;
  user: any;
}

const AppointmentForm = ({
  open,
  onClose,
  onSuccess,
  defaultValues,
  supabase,
  user,
}: Props) => {
  const { toast } = useToast();

  const [date, setDate] = useState<Date>(
    defaultValues?.date ? new Date(defaultValues.date) : new Date()
  );
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [pets, setPets] = useState<{ id: string; name: string; client_id: string }[]>([]);
  const [filteredPets, setFilteredPets] = useState<typeof pets>([]);
  const [services, setServices] = useState<{ id: string; name: string; price: number }[]>([]);

  // estados para autocomplete de cliente
  const [clientQuery, setClientQuery] = useState("");
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      time: defaultValues?.time || "",
      petId: defaultValues?.pet?.id || "",
      clientId: defaultValues?.client?.id || "",
      serviceId: defaultValues?.service?.id || "",
      notes: defaultValues?.notes || "",
      status: defaultValues?.status || "pending",
    },
  });

  const selectedClientId = watch("clientId");

  // Carrega dados de referência
  useEffect(() => {
    const loadReferenceData = async () => {
      if (!user) return;
      setDataLoading(true);
      try {
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name");
        if (clientsError) throw clientsError;
        setClients(clientsData || []);

        const { data: petsData, error: petsError } = await supabase
          .from("pets")
          .select("id, name, client_id")
          .eq("user_id", user.id)
          .order("name");
        if (petsError) throw petsError;
        setPets(petsData || []);

        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("id, name, price")
          .eq("user_id", user.id)
          .order("name");
        if (servicesError) throw servicesError;
        setServices(servicesData || []);
      } catch (e: any) {
        toast({ variant: "destructive", title: "Erro ao carregar dados", description: e.message });
      } finally {
        setDataLoading(false);
      }
    };

    if (open) {
      loadReferenceData();
    }
  }, [user, open, supabase, toast]);

  // quando muda o cliente selecionado, filtra os pets
  useEffect(() => {
    if (selectedClientId) {
      setFilteredPets(pets.filter((p) => p.client_id === selectedClientId));
    } else {
      setFilteredPets([]);
    }
  }, [selectedClientId, pets]);

  // sincronia de edição: preenche clientQuery e demais campos
  useEffect(() => {
    if (defaultValues) {
      setValue("time", defaultValues.time || "");
      setDate(defaultValues.date ? new Date(defaultValues.date + "T12:00:00") : new Date());
      setValue("petId", defaultValues.pet?.id || "");
      setValue("clientId", defaultValues.client?.id || "");
      setClientQuery(defaultValues.client?.name || "");
      setValue("serviceId", defaultValues.service?.id || "");
      setValue("notes", defaultValues.notes || "");
      setValue("status", defaultValues.status || "pending");
    }
  }, [defaultValues, setValue]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (!values.clientId || !values.petId || !values.serviceId || !values.time) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Selecione cliente, pet, serviço e hora.",
        });
        setLoading(false);
        return;
      }

      if (defaultValues?.id) {
        // update
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
        toast({ title: "Agendamento atualizado!" });
      } else {
        // insert
        const { error } = await supabase.from("appointments").insert([
          {
            date: format(date, "yyyy-MM-dd"),
            time: values.time,
            pet_id: values.petId,
            service_id: values.serviceId,
            status: values.status,
            notes: values.notes,
            user_id: user.id,
          },
        ]);
        if (error) throw error;
        toast({ title: "Agendamento criado!" });
      }

      reset();
      onSuccess();
      onClose();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // lista filtrada de clientes pelo que se digita
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientQuery.toLowerCase())
  );

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

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <h2 className="text-xl font-bold">
            {defaultValues?.id ? "Editar Agendamento" : "Novo Agendamento"}
          </h2>

          {dataLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <>
              {/* AUTOCOMPLETE CLIENTE */}
              <div className="relative">
                <label className="block text-sm mb-1">Cliente</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Digite para buscar..."
                  value={clientQuery}
                  onChange={(e) => {
                    setClientQuery(e.target.value);
                    setShowClientSuggestions(true);
                  }}
                  onFocus={() => setShowClientSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowClientSuggestions(false), 200)
                  }
                  disabled={loading}
                />
                <input type="hidden" {...register("clientId")} />
                {showClientSuggestions && filteredClients.length > 0 && (
                  <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto mt-1 rounded">
                    {filteredClients.map((c) => (
                      <li
                        key={c.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onMouseDown={() => {
                          setClientQuery(c.name);
                          setValue("clientId", c.id);
                          setShowClientSuggestions(false);
                        }}
                      >
                        {c.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* SELECT PET */}
              <div>
                <label className="block text-sm mb-1">Pet</label>
                <select
                  className="input w-full"
                  {...register("petId")}
                  disabled={!selectedClientId || loading}
                >
                  <option value="">Selecione um pet</option>
                  {filteredPets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECT SERVIÇO */}
              <div>
                <label className="block text-sm mb-1">Serviço</label>
                <select
                  className="input w-full"
                  {...register("serviceId")}
                  disabled={loading}
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} – R$ {s.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATA */}
              <div>
                <label className="block text-sm mb-1">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                      type="button"
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => setDate(d || new Date())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* HORA */}
              <div>
                <label className="block text-sm mb-1">Hora</label>
                <input
                  className="input w-full"
                  type="time"
                  {...register("time")}
                  disabled={loading}
                />
              </div>

              {/* STATUS */}
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
                </select>
              </div>

              {/* OBSERVAÇÕES */}
              <div>
                <label className="block text-sm mb-1">Observações</label>
                <textarea
                  className="input w-full"
                  {...register("notes")}
                  rows={2}
                  disabled={loading}
                />
              </div>

              {/* AÇÕES */}
              <div className="flex items-center gap-2 mt-4">
                <Button
                  type="submit"
                  className="bg-petblue-600 text-white"
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
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
