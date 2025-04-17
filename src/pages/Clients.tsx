
import { useState } from "react";
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
  Dog
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for clients and pets
const MOCK_CLIENTS = [
  { 
    id: "1", 
    name: "João Silva", 
    email: "joao.silva@email.com", 
    phone: "(11) 98765-4321", 
    address: "Rua das Flores, 123", 
    pets: [
      { id: "1", name: "Rex", type: "Cachorro", breed: "Labrador", age: 3 },
      { id: "2", name: "Mia", type: "Gato", breed: "Siamês", age: 2 }
    ] 
  },
  { 
    id: "2", 
    name: "Maria Oliveira", 
    email: "maria.oliveira@email.com", 
    phone: "(11) 91234-5678", 
    address: "Av. Paulista, 1000", 
    pets: [
      { id: "3", name: "Thor", type: "Cachorro", breed: "Golden Retriever", age: 5 }
    ] 
  },
  { 
    id: "3", 
    name: "Pedro Santos", 
    email: "pedro.santos@email.com", 
    phone: "(11) 99876-5432", 
    address: "Rua Augusta, 500", 
    pets: [
      { id: "4", name: "Luna", type: "Cachorro", breed: "Poodle", age: 2 },
      { id: "5", name: "Nina", type: "Gato", breed: "Persa", age: 4 }
    ] 
  },
  { 
    id: "4", 
    name: "Ana Costa", 
    email: "ana.costa@email.com", 
    phone: "(11) 95432-1098", 
    address: "Rua Consolação, 250", 
    pets: [
      { id: "6", name: "Max", type: "Cachorro", breed: "Shih Tzu", age: 1 }
    ] 
  },
  { 
    id: "5", 
    name: "Carlos Mendes", 
    email: "carlos.mendes@email.com", 
    phone: "(11) 93456-7890", 
    address: "Av. Rebouças, 750", 
    pets: [
      { id: "7", name: "Mel", type: "Cachorro", breed: "Yorkshire", age: 3 },
      { id: "8", name: "Bob", type: "Cachorro", breed: "Buldogue", age: 2 }
    ] 
  }
];

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  pets: Pet[];
}

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
}

const Clients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isPetDialogOpen, setIsPetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletePetDialogOpen, setIsDeletePetDialogOpen] = useState(false);
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

  // Filter clients based on search term
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.pets.some((pet) => 
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Open client dialog for adding or editing
  const openClientDialog = (client: Client | null = null) => {
    setSelectedClient(client);
    
    if (client) {
      setClientFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
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
        breed: pet.breed,
        age: pet.age.toString(),
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
  const handleClientSubmit = () => {
    if (!clientFormData.name || !clientFormData.email || !clientFormData.phone) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha os campos obrigatórios.",
      });
      return;
    }
    
    if (selectedClient) {
      // Edit existing client
      setClients(
        clients.map((client) =>
          client.id === selectedClient.id
            ? {
                ...client,
                ...clientFormData,
              }
            : client
        )
      );
      
      toast({
        title: "Cliente atualizado",
        description: `${clientFormData.name} foi atualizado com sucesso.`,
      });
    } else {
      // Add new client
      const newClient: Client = {
        id: Date.now().toString(),
        ...clientFormData,
        pets: [],
      };
      
      setClients([...clients, newClient]);
      
      toast({
        title: "Cliente adicionado",
        description: `${clientFormData.name} foi adicionado com sucesso.`,
      });
    }
    
    setIsClientDialogOpen(false);
  };

  // Handle pet form submission
  const handlePetSubmit = () => {
    if (!petFormData.name || !petFormData.type || !petFormData.breed || !petFormData.age) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
      });
      return;
    }
    
    if (!selectedClient) return;
    
    const age = parseInt(petFormData.age);
    
    if (isNaN(age) || age <= 0) {
      toast({
        variant: "destructive",
        title: "Idade inválida",
        description: "Por favor, informe uma idade válida.",
      });
      return;
    }
    
    if (selectedPet) {
      // Edit existing pet
      setClients(
        clients.map((client) =>
          client.id === selectedClient.id
            ? {
                ...client,
                pets: client.pets.map((pet) =>
                  pet.id === selectedPet.id
                    ? {
                        ...pet,
                        name: petFormData.name,
                        type: petFormData.type,
                        breed: petFormData.breed,
                        age,
                      }
                    : pet
                ),
              }
            : client
        )
      );
      
      toast({
        title: "Pet atualizado",
        description: `${petFormData.name} foi atualizado com sucesso.`,
      });
    } else {
      // Add new pet
      const newPet: Pet = {
        id: Date.now().toString(),
        name: petFormData.name,
        type: petFormData.type,
        breed: petFormData.breed,
        age,
      };
      
      setClients(
        clients.map((client) =>
          client.id === selectedClient.id
            ? {
                ...client,
                pets: [...client.pets, newPet],
              }
            : client
        )
      );
      
      toast({
        title: "Pet adicionado",
        description: `${petFormData.name} foi adicionado com sucesso.`,
      });
    }
    
    setIsPetDialogOpen(false);
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
  const handleDeleteClient = () => {
    if (!selectedClient) return;
    
    setClients(clients.filter((client) => client.id !== selectedClient.id));
    
    toast({
      title: "Cliente removido",
      description: `${selectedClient.name} foi removido com sucesso.`,
    });
    
    setIsDeleteDialogOpen(false);
  };

  // Handle pet deletion
  const handleDeletePet = () => {
    if (!selectedClient || !selectedPet) return;
    
    setClients(
      clients.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              pets: client.pets.filter((pet) => pet.id !== selectedPet.id),
            }
          : client
      )
    );
    
    toast({
      title: "Pet removido",
      description: `${selectedPet.name} foi removido com sucesso.`,
    });
    
    setIsDeletePetDialogOpen(false);
  };

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
