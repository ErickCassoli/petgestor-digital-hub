
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
import { useSaleCalculations } from "@/hooks/useSaleCalculations";
import { useSales } from "@/hooks/useSales";
import { ItemSelector } from "./ItemSelector";
import { SaleItemsList } from "./SaleItemsList";
import { DiscountForm } from "./DiscountForm";
import { SurchargeForm } from "./SurchargeForm";
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
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Use our custom hook for calculations
  const {
    subtotal,
    productSubtotal,
    serviceSubtotal,
    discount,
    calculatedDiscount,
    surcharge,
    total,
    handleDiscountChange,
    handleSurchargeChange
  } = useSaleCalculations(cartItems);

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
      setCartItems(updatedItems);
    } else {
      // Add new item
      setCartItems([...cartItems, item]);
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
    setCartItems(updatedItems);
  };

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
      
      // Call the createSale function from our hook
      const result = await createSale(
        cartItems,
        subtotal,
        calculatedDiscount,
        surcharge,
        total,
        clientId,
        clientName,
        paymentMethod,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <div>
            <Label htmlFor="payment_method">Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            />
            
            {cartItems.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DiscountForm
                    subtotal={subtotal}
                    discount={discount}
                    onDiscountChange={handleDiscountChange}
                  />
                  
                  <SurchargeForm
                    surcharge={surcharge}
                    onSurchargeChange={handleSurchargeChange}
                  />
                </div>
                
                <SaleSummary 
                  items={cartItems}
                  subtotal={subtotal}
                  discount={calculatedDiscount}
                  surcharge={surcharge}
                  total={total}
                  productSubtotal={productSubtotal}
                  serviceSubtotal={serviceSubtotal}
                />
              </>
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
