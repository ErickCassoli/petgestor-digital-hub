// src/pages/Clients.tsx
import React, { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, User, Dog } from "lucide-react";
import SearchInput from "@/components/clientpet/SearchInput";
import ClientsTable from "@/components/clientpet/ClientsTable";
import PetsTable from "@/components/clientpet/PetsTable";
import ClientFormDialog from "@/components/clientpet/ClientFormDialog";
import PetFormDialog from "@/components/clientpet/PetFormDialog";
import DeleteDialog from "@/components/clientpet/DeleteDialog";
import PetHistoryDialog from "@/components/clientpet/PetHistoryDialog";
import { PlanLimitNotice } from "@/components/subscription/PlanLimitNotice";
import { FreePlanAd } from "@/components/ads/FreePlanAd";
import { useClientsPets } from "@/hooks/useClientsPets";
import { Client, Pet, Appointment } from "@/types/clients";

const Clients: React.FC = () => {
  const {
    clients,
    loading,
    saveClient,
    deleteClient,
    savePet,
    deletePet,
    fetchPetHistory,
  } = useClientsPets();

  const [searchTerm, setSearchTerm] = useState("");
  const totalPets = clients.reduce((sum, client) => sum + client.pets.length, 0);
  const adSlotClients = import.meta.env.VITE_ADSENSE_SLOT_CLIENTS;
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [petDialogOpen, setPetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"client" | "pet" | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [petHistory, setPetHistory] = useState<Appointment[]>([]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email &&
      client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone && client.phone.includes(searchTerm)) ||
    client.pets.some((pet) =>
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.breed &&
        pet.breed.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const petRows = filteredClients.flatMap((client) =>
    client.pets.map((pet) => ({ client, pet }))
  );

  const handleOpenClient = (client?: Client) => {
    setSelectedClient(client || null);
    setClientDialogOpen(true);
  };

  const handleOpenPet = (clientId: string, pet?: Pet) => {
    const client = clients.find((c) => c.id === clientId)!;
    setSelectedClient(client);
    setSelectedPet(pet || null);
    setPetDialogOpen(true);
  };

  const handleOpenDelete = (type: "client" | "pet", item: Client | Pet) => {
    setDeleteType(type);
    if (type === "client") setSelectedClient(item);
    else setSelectedPet(item);
    setDeleteDialogOpen(true);
  };

  const handleViewHistory = async (pet: Pet) => {
    const history = await fetchPetHistory(pet.id);
    setPetHistory(history);
    setSelectedPet(pet);
    setHistoryDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-petblue-600" />
        <span className="ml-2 text-lg text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes e Pets</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os clientes e seus pets
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            className="bg-petblue-600 hover:bg-petblue-700"
            onClick={() => handleOpenClient()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <PlanLimitNotice usage={{ pets: totalPets }} />

      <SearchInput
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Busque por nome, email, telefone, pet..."
      />

      <Tabs defaultValue="clients">
        <TabsList className="mb-6">
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="pets">Pets</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          {filteredClients.length > 0 ? (
            <ClientsTable
              clients={filteredClients}
              onEdit={handleOpenClient}
              onAddPet={(id) => handleOpenPet(id)}
              onDelete={(c) => handleOpenDelete("client", c)}
            />
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-2 text-gray-500 font-medium">
                Nenhum cliente encontrado
              </p>
              <p className="text-gray-400">
                Adicione um novo cliente ou ajuste sua busca
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pets">
          {petRows.length > 0 ? (
            <PetsTable
              rows={petRows}
              onEdit={handleOpenPet}
              onDelete={(p) => handleOpenDelete("pet", p)}
              onViewHistory={handleViewHistory}
            />
          ) : (
            <div className="text-center py-8">
              <Dog className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-2 text-gray-500 font-medium">
                Nenhum pet encontrado
              </p>
              <p className="text-gray-400">
                Adicione pets aos seus clientes
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ClientFormDialog
        open={clientDialogOpen}
        client={selectedClient}
        onClose={() => setClientDialogOpen(false)}
        onSave={(data) => {
          saveClient(data, selectedClient?.id);
          setClientDialogOpen(false);
        }}
      />

      <PetFormDialog
        open={petDialogOpen}
        pet={selectedPet}
        client={selectedClient}
        onClose={() => setPetDialogOpen(false)}
        onSave={(data) => {
          savePet(data, selectedClient!.id, selectedPet?.id);
          setPetDialogOpen(false);
        }}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        title={deleteType === "client" ? "Excluir Cliente" : "Excluir Pet"}
        description={
          deleteType === "client" ? (
            <>Tem certeza que deseja excluir o cliente <strong>{selectedClient?.name}</strong>?</>
          ) : (
            <>Tem certeza que deseja excluir o pet <strong>{selectedPet?.name}</strong>?</>
          )
        }
        onConfirm={() => {
          if (deleteType === "client" && selectedClient) {
            deleteClient(selectedClient.id);
          }
          if (deleteType === "pet" && selectedPet) {
            deletePet(selectedPet.id);
          }
          setDeleteDialogOpen(false);
        }}
        onClose={() => setDeleteDialogOpen(false)}
      />

      <FreePlanAd slot={adSlotClients} className="mt-10" />

      <PetHistoryDialog
        open={historyDialogOpen}
        petName={selectedPet?.name || ""}
        history={petHistory}
        onClose={() => setHistoryDialogOpen(false)}
      />
    </div>
  );
};

export default Clients;




