
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  User,
  Phone,
  Mail,
  Home,
  Dog,
  Loader2
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  pets: Pet[];
}

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: number | null;
  client_id: string;
}

const Clients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletePetDialogOpen, setIsDeletePetDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientFormData, setClientFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [petFormData, setPetFormData] = useState({
    name: "",
    type: "",
    breed: "",
    age: "",
  });

  // Fetch clients and pets data from Supabase
  useEffect(() => {
    const fetchClientsAndPets = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id);
        
        if (clientsError) throw clientsError;
        
        // Fetch pets
        const { data: petsData, error: petsError } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', user.id);
        
        if (petsError) throw petsError;
        
        // Organize data: add pets to their respective clients
        const clientsWithPets = clientsData.map(client => {
          const clientPets = petsData.filter(pet => pet.client_id === client.id);
          return {
            ...client,
            pets: clientPets
          };
        });
        
        setClients(clientsWithPets);
        setPets(petsData);
      } catch (error) {
        console.error('Error fetching clients and pets:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao buscar os clientes e pets."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientsAndPets();
  }, [user, toast]);

  // Filter clients based on search term
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone && client.phone.includes(searchTerm)) ||
    client.pets.some((pet) => 
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.breed && pet.breed.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  // Open client dialog for adding or editing
  const openClientDialog = (client: Client | null = null) => {
    setSelectedClient(client);
    
    if (client) {
      setClientFormData({
        name: client.name,
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
      });
    } else {
      setClientFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
    }
    
    setIsClientDialogOpen(true);
  };

  // Open pet dialog for adding or editing
  const openPetDialog = (clientId: string, pet: Pet | null = null) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    
    setSelectedClient(client);
    setSelectedPet(pet);
    
    if (pet) {
      setPetFormData({
        name: pet.name,
        type: pet.type,
        breed: pet.breed || "",
        age: pet.age?.toString() || "",
      });
    } else {
      setPetFormData({
        name: "",
        type: "",
        breed: "",
        age: "",
      });
    }
    
    setIsPetDialogOpen(true);
  };

  // Handle client form submission
  const handleClientSubmit = async () => {
    if (!user) return;
    
    if (!clientFormData.name) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome do cliente.",
      });
      return;
    }
    
    try {
      if (selectedClient) {
        // Edit existing client
        const { error } = await supabase
          .from('clients')
          .update({
            name: clientFormData.name,
            email: clientFormData.email || null,
            phone: clientFormData.phone || null,
            address: clientFormData.address || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedClient.id);
        
        if (error) throw error;
        
        // Update local state
        setClients(clients.map(client =>
          client.id === selectedClient.id
            ? {
                ...client,
                name: clientFormData.name,
                email: clientFormData.email || null,
                phone: clientFormData.phone || null,
                address: clientFormData.address || null
              }
            : client
        ));
        
        toast({
          title: "Cliente atualizado",
          description: `${clientFormData.name} foi atualizado com sucesso.`,
        });
      } else {
        // Add new client
        const { data, error } = await supabase
          .from('clients')
          .insert({
            name: clientFormData.name,
            email: clientFormData.email || null,
            phone: clientFormData.phone || null,
            address: clientFormData.address || null,
            user_id: user.id
          })
          .select();
        
        if (error) throw error;
        
        // Update local state
        if (data && data.length > 0) {
          const newClient = {
            ...data[0],
            pets: []
          };
          setClients([...clients, newClient]);
        }
        
        toast({
          title: "Cliente adicionado",
          description: `${clientFormData.name} foi adicionado com sucesso.`,
        });
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o cliente.",
      });
    } finally {
      setIsClientDialogOpen(false);
    }
  };

  // Handle pet form submission
  const handlePetSubmit = async () => {
    if (!user || !selectedClient) return;
    
    if (!petFormData.name || !petFormData.type) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e tipo do pet.",
      });
      return;
    }
    
    let age: number | null = null;
    if (petFormData.age) {
      age = parseInt(petFormData.age);
      if (isNaN(age) || age <= 0) {
        toast({
          variant: "destructive",
          title: "Idade inválida",
          description: "Por favor, informe uma idade válida.",
        });
        return;
      }
    }
    
    try {
      if (selectedPet) {
        // Edit existing pet
        const { error } = await supabase
          .from('pets')
          .update({
            name: petFormData.name,
            type: petFormData.type,
            breed: petFormData.breed || null,
            age: age,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPet.id);
        
        if (error) throw error;
        
        // Update local state
        const updatedPet = {
          ...selectedPet,
          name: petFormData.name,
          type: petFormData.type,
          breed: petFormData.breed || null,
          age: age
        };
        
        setPets(pets.map(pet => pet.id === selectedPet.id ? updatedPet : pet));
        
        setClients(clients.map(client =>
          client.id === selectedClient.id
            ? {
                ...client,
                pets: client.pets.map(pet => pet.id === selectedPet.id ? updatedPet : pet)
              }
            : client
        ));
        
        toast({
          title: "Pet atualizado",
          description: `${petFormData.name} foi atualizado com sucesso.`,
        });
      } else {
        // Add new pet
        const { data, error } = await supabase
          .from('pets')
          .insert({
            name: petFormData.name,
            type: petFormData.type,
            breed: petFormData.breed || null,
            age: age,
            client_id: selectedClient.id,
            user_id: user.id
          })
          .select();
        
        if (error) throw error;
        
        // Update local state
        if (data && data.length > 0) {
          const newPet = data[0];
          setPets([...pets, newPet]);
          
          setClients(clients.map(client =>
            client.id === selectedClient.id
              ? {
                  ...client,
                  pets: [...client.pets, newPet]
                }
              : client
          ));
        }
        
        toast({
          title: "Pet adicionado",
          description: `${petFormData.name} foi adicionado com sucesso.`,
        });
      }
    } catch (error) {
      console.error('Error saving pet:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o pet.",
      });
    } finally {
      setIsPetDialogOpen(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  // Open delete pet confirmation dialog
  const openDeletePetDialog = (clientId: string, pet: Pet) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    
    setSelectedClient(client);
    setSelectedPet(pet);
    setIsDeletePetDialogOpen(true);
  };

  // Handle client deletion
  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id);
      
      if (error) throw error;
      
      // Update local state
      setClients(clients.filter(client => client.id !== selectedClient.id));
      setPets(pets.filter(pet => pet.client_id !== selectedClient.id));
      
      toast({
        title: "Cliente removido",
        description: `${selectedClient.name} foi removido com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Ocorreu um erro ao remover o cliente.",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle pet deletion
  const handleDeletePet = async () => {
    if (!selectedPet) return;
    
    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', selectedPet.id);
      
      if (error) throw error;
      
      // Update local state
      setPets(pets.filter(pet => pet.id !== selectedPet.id));
      
      setClients(clients.map(client =>
        client.id === selectedPet.client_id
          ? {
              ...client,
              pets: client.pets.filter(pet => pet.id !== selectedPet.id)
            }
          : client
      ));
      
      toast({
        title: "Pet removido",
        description: `${selectedPet.name} foi removido com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Ocorreu um erro ao remover o pet.",
      });
    } finally {
      setIsDeletePetDialogOpen(false);
    }
  };

  // JSX for the loading state
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
            onClick={() => openClientDialog()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Buscar Clientes e Pets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Busque por nome, email, telefone, pet..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="clients">
        <TabsList className="mb-6">
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="pets">Pets</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500 font-medium">Nenhum cliente encontrado</p>
                  <p className="text-gray-400">Adicione um novo cliente ou ajuste sua busca</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Pets</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {client.phone}
                            </span>
                            <span className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {client.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.pets.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {client.pets.map((pet) => (
                                <span 
                                  key={pet.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-petblue-100 text-petblue-800"
                                >
                                  <Dog className="h-3 w-3 mr-1" />
                                  {pet.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Nenhum pet</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openClientDialog(client)}
                            >
                              <Edit className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPetDialog(client.id)}
                            >
                              <Dog className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(client)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pets">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pets</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredClients.flatMap(client => client.pets).length === 0 ? (
                <div className="text-center py-8">
                  <Dog className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500 font-medium">Nenhum pet encontrado</p>
                  <p className="text-gray-400">Adicione pets aos seus clientes</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo / Raça</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Tutor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.flatMap(client =>
                      client.pets.map(pet => (
                        <TableRow key={pet.id}>
                          <TableCell className="font-medium">{pet.name}</TableCell>
                          <TableCell>
                            {pet.type} / {pet.breed}
                          </TableCell>
                          <TableCell>
                            {pet.age} {pet.age === 1 ? 'ano' : 'anos'}
                          </TableCell>
                          <TableCell>{client.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openPetDialog(client.id, pet)}
                              >
                                <Edit className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeletePetDialog(client.id, pet)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Client Dialog */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do cliente. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  placeholder="Nome completo"
                  className="pl-10"
                  value={clientFormData.name}
                  onChange={(e) =>
                    setClientFormData({ ...clientFormData, name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  className="pl-10"
                  value={clientFormData.email}
                  onChange={(e) =>
                    setClientFormData({ ...clientFormData, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  className="pl-10"
                  value={clientFormData.phone}
                  onChange={(e) =>
                    setClientFormData({ ...clientFormData, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade"
                  className="pl-10"
                  value={clientFormData.address}
                  onChange={(e) =>
                    setClientFormData({ ...clientFormData, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClientDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleClientSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pet Dialog */}
      <Dialog open={isPetDialogOpen} onOpenChange={setIsPetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedPet ? "Editar Pet" : "Novo Pet"}
            </DialogTitle>
            <DialogDescription>
              {selectedClient && `Cliente: ${selectedClient.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pet-name">Nome *</Label>
              <Input
                id="pet-name"
                placeholder="Nome do pet"
                value={petFormData.name}
                onChange={(e) =>
                  setPetFormData({ ...petFormData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pet-type">Tipo *</Label>
              <Input
                id="pet-type"
                placeholder="Cachorro, Gato, etc."
                value={petFormData.type}
                onChange={(e) =>
                  setPetFormData({ ...petFormData, type: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pet-breed">Raça *</Label>
              <Input
                id="pet-breed"
                placeholder="Raça do pet"
                value={petFormData.breed}
                onChange={(e) =>
                  setPetFormData({ ...petFormData, breed: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pet-age">Idade (anos) *</Label>
              <Input
                id="pet-age"
                type="number"
                min="0"
                placeholder="Idade em anos"
                value={petFormData.age}
                onChange={(e) =>
                  setPetFormData({ ...petFormData, age: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPetDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePetSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Client Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente e todos os seus pets.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir o cliente{" "}
              <span className="font-semibold">{selectedClient?.name}</span>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Pet Confirmation Dialog */}
      <Dialog open={isDeletePetDialogOpen} onOpenChange={setIsDeletePetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Excluir Pet</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o pet.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir o pet{" "}
              <span className="font-semibold">{selectedPet?.name}</span>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeletePetDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePet}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
