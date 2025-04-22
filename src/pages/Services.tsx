
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
}

export default function Services() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // For new/editable service
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", description: "" });

  const fetchServices = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price, description")
      .eq("user_id", user.id)
      .order("name");
    if (error) {
      toast({ title: "Erro ao carregar serviços", variant: "destructive" });
      setLoading(false);
      return;
    }
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle field change on add/edit
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save new or edited service
  const handleSave = async () => {
    setLoading(true);
    if (!form.name || !form.price) {
      toast({ title: "Preencha nome e preço!", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (editId) {
      // Update existing
      const { error } = await supabase.from("services").update({
        name: form.name,
        price: Number(form.price),
        description: form.description,
      }).eq("id", editId).eq("user_id", user.id);
      if (error) {
        toast({ title: "Erro ao salvar!", variant: "destructive" });
      } else {
        toast({ title: "Serviço atualizado." });
        fetchServices();
        setEditId(null);
        setForm({ name: "", price: "", description: "" });
      }
    } else {
      // Insert new
      const { error } = await supabase.from("services").insert({
        name: form.name,
        price: Number(form.price),
        description: form.description,
        user_id: user.id
      });
      if (error) {
        toast({ title: "Erro ao criar serviço!", variant: "destructive" });
      } else {
        toast({ title: "Serviço criado!" });
        fetchServices();
        setForm({ name: "", price: "", description: "" });
      }
    }
    setLoading(false);
  };

  // Edit selected service
  const handleEdit = (service: Service) => {
    setEditId(service.id);
    setForm({ name: service.name, price: service.price.toString(), description: service.description || "" });
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
        setForm({ name: "", price: "", description: "" });
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 p-4 bg-white dark:bg-slate-900 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Seus Serviços</h1>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">{editId ? "Editar serviço" : "Adicionar novo serviço"}</h2>
        <div className="flex gap-2 mb-2">
          <Input
            name="name"
            placeholder="Nome do serviço"
            value={form.name}
            onChange={handleChange}
            className="max-w-xs"
            disabled={loading}
          />
          <Input
            name="price"
            placeholder="Preço (R$)"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            className="max-w-[120px]"
            disabled={loading}
          />
          <Input
            name="description"
            placeholder="Descrição curta"
            value={form.description}
            onChange={handleChange}
            className="max-w-xs"
            disabled={loading}
          />
          <Button onClick={handleSave} disabled={loading}>
            {editId ? "Salvar edição" : "Adicionar"}
          </Button>
          {editId && (
            <Button variant="outline" onClick={() => { setEditId(null); setForm({ name: "", price: "", description: "" }); }}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
      <hr className="mb-6" />
      {loading ? (
        <p>Carregando...</p>
      ) : services.length === 0 ? (
        <p className="text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
      ) : (
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="p-2 text-left">Nome</th>
              <th className="p-2">Preço (R$)</th>
              <th className="p-2">Descrição</th>
              <th className="p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id} className="border-t">
                <td className="p-2">{service.name}</td>
                <td className="p-2 text-center">{Number(service.price).toFixed(2)}</td>
                <td className="p-2">{service.description}</td>
                <td className="p-2 text-center flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(service.id)}>Excluir</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
