// src/hooks/useClientsPets.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Client, Pet, Appointment } from "@/types/clients";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { buildSupabaseToast } from "@/utils/supabaseError";

export function useClientsPets() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id);
      if (clientsError) throw clientsError;

      const { data: petsData, error: petsError } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user.id);
      if (petsError) throw petsError;

      const clientsWithPets: Client[] = clientsData.map((c) => ({
        ...c,
        pets: petsData.filter((p) => p.client_id === c.id),
      }));

      setClients(clientsWithPets);
    } catch (err: unknown) {
      console.error("Error fetching clients & pets", err);
      const friendly = buildSupabaseToast(err, {
        title: 'Erro ao carregar dados',
        description: 'Ocorreu um erro ao buscar clientes e pets.',
      });
      toast({ variant: 'destructive', ...friendly });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const saveClient = async (
    data: Omit<Client, "id" | "pets">,
    clientId?: string
  ) => {
    try {
      if (clientId) {
        const { error } = await supabase
          .from("clients")
          .update(data)
          .eq("id", clientId);
        if (error) throw error;
        toast({ title: "Cliente atualizado", description: data.name });
      } else {
        const { error } = await supabase
          .from("clients")
          .insert({ ...data, user_id: user!.id });
        if (error) throw error;
        toast({ title: "Cliente adicionado", description: data.name });
      }
      await fetchData();
    } catch (err: unknown) {
      console.error("Error saving client", err);
      const friendly = buildSupabaseToast(err, {
        title: 'Erro ao salvar cliente',
        description: 'Ocorreu um erro ao salvar o cliente.',
      });
      toast({ variant: 'destructive', ...friendly });
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);
      if (error) throw error;
      toast({ title: "Cliente removido" });
      await fetchData();
    } catch (err: unknown) {
      console.error("Error deleting client", err);
      const friendly = buildSupabaseToast(err, {
        title: 'Erro ao remover cliente',
        description: 'Ocorreu um erro ao remover o cliente.',
      });
      toast({ variant: 'destructive', ...friendly });
    }
  };

  const savePet = async (
    data: Omit<Pet, "id" | "client_id" | "user_id">,
    clientId: string,
    petId?: string
  ) => {
    try {
      if (petId) {
        const { error } = await supabase
          .from("pets")
          .update(data)
          .eq("id", petId);
        if (error) throw error;
        toast({ title: "Pet atualizado", description: data.name });
      } else {
        const { error } = await supabase
          .from("pets")
          .insert({ ...data, client_id: clientId, user_id: user!.id });
        if (error) throw error;
        toast({ title: "Pet adicionado", description: data.name });
      }
      await fetchData();
    } catch (err: unknown) {
      console.error("Error saving pet", err);
      const friendly = buildSupabaseToast(err, {
        title: 'Erro ao salvar pet',
        description: 'Ocorreu um erro ao salvar o pet.',
      });
      toast({ variant: 'destructive', ...friendly });
    }
  };

  const deletePet = async (petId: string) => {
    try {
      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", petId);
      if (error) throw error;
      toast({ title: "Pet removido" });
      await fetchData();
    } catch (err: unknown) {
      console.error("Error deleting pet", err);
      const friendly = buildSupabaseToast(err, {
        title: 'Erro ao remover pet',
        description: 'Ocorreu um erro ao remover o pet.',
      });
      toast({ variant: 'destructive', ...friendly });
    }
  };

  const fetchPetHistory = async (petId: string): Promise<Appointment[]> => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          date,
          status,
          notes,
          pet_id,
          services ( name )
        `)
        .eq("pet_id", petId)
        .order("date", { ascending: false });
      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        date: row.date,
        status: row.status,
        notes: row.notes,
        pet_id: row.pet_id,
        service: row.services?.name ?? null,
      }));
    } catch (err: any) {
      console.error("Error fetching pet history", err);
      toast({
        variant: "destructive",
        title: "Erro ao carregar histórico",
        description: err.message,
      });
      return [];
    }
  };

  return {
    clients,
    loading,
    saveClient,
    deleteClient,
    savePet,
    deletePet,
    fetchPetHistory,
  };
}
