import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { X, Save } from "lucide-react";
import { CartItem } from "@/types/sales";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSales } from "@/hooks/useSales";
import { ItemSelector } from "./ItemSelector";
import { SaleItemsList } from "./SaleItemsList";
import { SaleSummary } from "./SaleSummary";

interface Client {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration: number;
}

interface SaleFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function SaleForm({ onComplete, onCancel }: SaleFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createSale } = useSales();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('no_client');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [generalSurcharge, setGeneralSurcharge] = useState<number>(0);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchServices();
  }, []);

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name');
    setClients(data || []);
  };

  const fetchProducts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .eq('user_id', user.id)
      .order('name');
    setProducts(data || []);
  };

  const fetchServices = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('services')
      .select('id, name, price, description, duration')
      .eq('user_id', user.id)
      .order('name');
    setServices(data || []);
  };

  const handleAddItem = (item: CartItem) => {
    // Check if product has enough stock
    if (item.type === 'product') {
      const product = products.find(p => p.id === item.id);
      if (product && product.stock <= 0) {
        toast({
          variant: "destructive",
          title: "Estoque insuficiente",
          description: `Não há unidades disponíveis de ${item.name}`,
        });
        return;
      }
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(
      i => i.id === item.id && i.type === item.type
    );

    if (existingItemIndex >= 0) {
      // If it's a product, check if we have enough stock
      if (item.type === 'product') {
        const product = products.find(p => p.id === item.id);
        const currentQuantity = cartItems[existingItemIndex].quantity;
        
        if (product && currentQuantity + 1 > product.stock) {
          toast({
            variant: "destructive",
            title: "Estoque insuficiente",
            description: `Apenas ${product.stock} unidades disponíveis de ${item.name}`,
          });
          return;
        }
      }
      
      // Increment quantity if item already exists
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      // Recalculate total
      updatedItems[existingItemIndex].total = 
        updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
      setCartItems(updatedItems);
    } else {
      // Add new item with total calculated
      const newItem = {
        ...item,
        total: item.price * item.quantity,
        discount: 0,
        surcharge: 0
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // If it's a product, check stock constraints
    const item = cartItems[index];
    if (item.type === 'product') {
      const product = products.find(p => p.id === item.id);
      if (product && newQuantity > product.stock) {
        toast({
          variant: "destructive",
          title: "Estoque insuficiente",
          description: `Apenas ${product.stock} unidades disponíveis de ${item.name}`,
        });
        return;
      }
    }
    
    const updatedItems = [...cartItems];
    updatedItems[index].quantity = newQuantity;
    // Recalculate total
    updatedItems[index].total = updatedItems[index].price * newQuantity;
    setCartItems(updatedItems);
  };

  const handleUpdateDiscount = (index: number, discount: number) => {
    const updatedItems = [...cartItems];
    updatedItems[index].discount = discount;
    // Update total with discount
    const baseTotal = updatedItems[index].price * updatedItems[index].quantity;
    updatedItems[index].total = baseTotal - discount + (updatedItems[index].surcharge || 0);
    setCartItems(updatedItems);
  };

  const handleUpdateSurcharge = (index: number, surcharge: number) => {
    const updatedItems = [...cartItems];
    updatedItems[index].surcharge = surcharge;
    // Update total with surcharge
    const baseTotal = updatedItems[index].price * updatedItems[index].quantity;
    updatedItems[index].total = baseTotal - (updatedItems[index].discount || 0) + surcharge;
    setCartItems(updatedItems);
  };

  // Cálculos
  const subtotal = cartItems.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0);

  const itemDiscountsTotal = cartItems.reduce((sum, item) => 
    sum + (item.discount || 0), 0);
  
  const itemSurchargesTotal = cartItems.reduce((sum, item) => 
    sum + (item.surcharge || 0), 0);

  // Total com desconto/acréscimo geral + individuais
  const total = subtotal - itemDiscountsTotal - generalDiscount + 
    itemSurchargesTotal + generalSurcharge;

  // Subtotais para produtos e serviços (para exibição)
  const productSubtotal = cartItems
    .filter(item => item.type === 'product')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const serviceSubtotal = cartItems
    .filter(item => item.type === 'service')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSaveSale = async () => {
    if (cartItems.length === 0) {
      toast({ title: "Adicione pelo menos um item para concluir a venda", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Get client name if a client is selected
      let clientName = null;
      let clientId = null;
      
      if (selectedClient !== 'no_client') {
        clientId = selectedClient;
        const client = clients.find(c => c.id === selectedClient);
        clientName = client?.name || null;
      }
      
      // Calcular desconto e acréscimo totais (gerais + por item)
      const totalDiscount = generalDiscount + itemDiscountsTotal;
      const totalSurcharge = generalSurcharge + itemSurchargesTotal;
      
      // Call the createSale function from our hook
      // Using 'cash' as default payment method
      const result = await createSale(
        cartItems,
        subtotal,
        totalDiscount,
        totalSurcharge,
        total,
        clientId,
        clientName,
        'cash', // Default payment method as cash
        notes || null
      );
      
      if (result) {
        onComplete();
      }
    } catch (error) {
      console.error("Error saving sale:", error);
      toast({ 
        title: "Erro ao registrar venda", 
        description: "Ocorreu um erro ao salvar a venda. Tente novamente.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova Venda</DialogTitle>
        <DialogDescription>Adicione produtos ou serviços para registrar uma nova venda</DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-6 py-4">
        <div>
          <Label htmlFor="client">Cliente (opcional)</Label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_client">Sem cliente</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ItemSelector 
              products={products} 
              services={services}
              onAddItem={handleAddItem}
            />
            
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre a venda"
                className="h-[100px]"
              />
            </div>
          </div>

          <div className="space-y-6">
            <SaleItemsList 
              items={cartItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateDiscount={handleUpdateDiscount}
              onUpdateSurcharge={handleUpdateSurcharge}
            />
            
            {cartItems.length > 0 && (
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <Label className="mb-2 block">Desconto/Acréscimo Geral</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Desconto geral (R$)</Label>
                      <input
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={generalDiscount}
                        onChange={(e) => setGeneralDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Acréscimo geral (R$)</Label>
                      <input
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={generalSurcharge}
                        onChange={(e) => setGeneralSurcharge(parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                <SaleSummary 
                  items={cartItems}
                  subtotal={subtotal}
                  discount={(itemDiscountsTotal + generalDiscount)}
                  surcharge={(itemSurchargesTotal + generalSurcharge)}
                  total={total}
                  productSubtotal={productSubtotal}
                  serviceSubtotal={serviceSubtotal}
                  itemDiscounts={itemDiscountsTotal}
                  itemSurcharges={itemSurchargesTotal}
                  generalDiscount={generalDiscount}
                  generalSurcharge={generalSurcharge}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button 
          onClick={handleSaveSale} 
          disabled={cartItems.length === 0 || loading}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Salvando..." : "Finalizar venda"}
        </Button>
      </div>
    </>
  );
}
