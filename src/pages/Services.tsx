
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
}

export default function Services() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // For new/editable service
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", duration: "" });

  const fetchServices = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price, description, duration")
      .eq("user_id", user.id)
      .order("name");
    if (error) {
      toast({ title: "Erro ao carregar serviços", variant: "destructive" });
      setLoading(false);
      return;
    }
    setServices(data || []);
    setFilteredServices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filter services when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredServices(services);
      return;
    }
    
    const filtered = services.filter(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [searchTerm, services]);

  // Handle field change on add/edit
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save new or edited service
  const handleSave = async () => {
    setLoading(true);
    if (!form.name || !form.price || !form.duration) {
      toast({ title: "Preencha nome, preço e duração!", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (editId) {
      // Update existing
      const { error } = await supabase.from("services").update({
        name: form.name,
        price: Number(form.price),
        description: form.description,
        duration: Number(form.duration)
      }).eq("id", editId).eq("user_id", user.id);
      if (error) {
        toast({ title: "Erro ao salvar!", variant: "destructive" });
      } else {
        toast({ title: "Serviço atualizado." });
        fetchServices();
        setEditId(null);
        setForm({ name: "", price: "", description: "", duration: "" });
      }
    } else {
      // Insert new
      const { error } = await supabase.from("services").insert({
        name: form.name,
        price: Number(form.price),
        description: form.description,
        duration: Number(form.duration),
        user_id: user.id
      });
      if (error) {
        toast({ title: "Erro ao criar serviço!", variant: "destructive" });
      } else {
        toast({ title: "Serviço criado!" });
        fetchServices();
        setForm({ name: "", price: "", description: "", duration: "" });
      }
    }
    setLoading(false);
  };

  // Edit selected service
  const handleEdit = (service: Service) => {
    setEditId(service.id);
    setForm({ 
      name: service.name, 
      price: service.price.toString(), 
      description: service.description || "",
      duration: service.duration.toString()
    });
  };

  // Delete service
  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este serviço?")) return;
    setLoading(true);
    const { error } = await supabase.from("services").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      toast({ title: "Erro ao excluir!", variant: "destructive" });
    } else {
      toast({ title: "Serviço excluído!" });
      fetchServices();
      if (editId === id) {
        setEditId(null);
        setForm({ name: "", price: "", description: "", duration: "" });
      }
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Gerenciar Serviços</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{editId ? "Editar serviço" : "Adicionar novo serviço"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Nome do serviço</label>
              <Input
                id="name"
                name="name"
                placeholder="Nome do serviço"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">Preço (R$)</label>
              <Input
                id="price"
                name="price"
                placeholder="Preço (R$)"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium mb-1">Duração (minutos)</label>
              <Input
                id="duration"
                name="duration"
                placeholder="Duração (min)"
                type="number"
                min="1"
                value={form.duration}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descrição curta"
                value={form.description}
                onChange={handleChange}
                disabled={loading}
                rows={3}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editId ? "Salvar alterações" : "Adicionar serviço"}
            </Button>
            {editId && (
              <Button variant="outline" onClick={() => { 
                setEditId(null); 
                setForm({ name: "", price: "", description: "", duration: "" }); 
              }}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
        
        <hr className="my-6" />
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Serviços cadastrados</h2>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum serviço encontrado para esta busca." : "Nenhum serviço cadastrado ainda."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">Nome</th>
                    <th className="p-2 text-right">Preço (R$)</th>
                    <th className="p-2 text-center">Duração (min)</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr key={service.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{service.name}</td>
                      <td className="p-2 text-right">{Number(service.price).toFixed(2)}</td>
                      <td className="p-2 text-center">{service.duration}</td>
                      <td className="p-2 max-w-xs truncate">{service.description}</td>
                      <td className="p-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>Editar</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(service.id)}>Excluir</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
