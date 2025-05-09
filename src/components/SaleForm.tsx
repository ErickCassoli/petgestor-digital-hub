
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { X, Save } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CartItem } from "@/types/sales";
import { ItemSelector } from "./sales/ItemSelector";
import { SaleItemsList } from "./sales/SaleItemsList";
import SaleDiscountForm from "./sales/SaleDiscountForm";

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

export default function SaleForm({ onComplete, onCancel }: SaleFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('no_client');
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState({ total: 0, products: 0, services: 0 });
  const [surcharge, setSurcharge] = useState({ total: 0, products: 0, services: 0 });

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

  // Calculate subtotals
  const subtotalProducts = selectedItems
    .filter(item => item.type === "product")
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const subtotalServices = selectedItems
    .filter(item => item.type === "service")
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const subtotal = subtotalProducts + subtotalServices;

  // Calculate discount and surcharge based on active tab
  const discountAmount = discount.total > 0 
    ? discount.total 
    : (discount.products + discount.services);

  const surchargeAmount = surcharge.total > 0 
    ? surcharge.total 
    : (surcharge.products + surcharge.services);

  // Calculate final total (never negative)
  const totalAmount = Math.max(0, subtotal - discountAmount + surchargeAmount);

  // Calculate products total after discount/surcharge
  const adjustedProductsTotal = () => {
    if (discount.total > 0 && subtotal > 0) {
      // Apply proportional discount
      const productsPortion = subtotalProducts / subtotal;
      const discountForProducts = discount.total * productsPortion;
      return Math.max(0, subtotalProducts - discountForProducts);
    } else {
      return Math.max(0, subtotalProducts - discount.products);
    }
  };

  // Calculate services total after discount/surcharge
  const adjustedServicesTotal = () => {
    if (discount.total > 0 && subtotal > 0) {
      // Apply proportional discount
      const servicesPortion = subtotalServices / subtotal;
      const discountForServices = discount.total * servicesPortion;
      return Math.max(0, subtotalServices - discountForServices);
    } else {
      return Math.max(0, subtotalServices - discount.services);
    }
  };

  // Add surcharge to products
  const finalProductsTotal = () => {
    const adjustedProducts = adjustedProductsTotal();
    if (surcharge.total > 0 && subtotal > 0) {
      // Apply proportional surcharge
      const productsPortion = subtotalProducts / subtotal;
      const surchargeForProducts = surcharge.total * productsPortion;
      return adjustedProducts + surchargeForProducts;
    } else {
      return adjustedProducts + surcharge.products;
    }
  };

  // Add surcharge to services
  const finalServicesTotal = () => {
    const adjustedServices = adjustedServicesTotal();
    if (surcharge.total > 0 && subtotal > 0) {
      // Apply proportional surcharge
      const servicesPortion = subtotalServices / subtotal;
      const surchargeForServices = surcharge.total * servicesPortion;
      return adjustedServices + surchargeForServices;
    } else {
      return adjustedServices + surcharge.services;
    }
  };

  const handleAddItem = (item: CartItem) => {
    // Check if item already exists in the cart
    const existingItemIndex = selectedItems.findIndex(
      i => i.id === item.id && i.type === item.type
    );

    if (existingItemIndex >= 0) {
      // Increment quantity if item already exists
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      // Add new item with quantity 1
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...selectedItems];
    updatedItems[index].quantity = newQuantity;
    setSelectedItems(updatedItems);
  };

  const handleSaveSale = async () => {
    if (selectedItems.length === 0) {
      toast({ title: "Adicione pelo menos um item para concluir a venda", variant: "destructive" });
      return;
    }

    if (discount.total > subtotal) {
      toast({ title: "O desconto não pode ser maior que o valor total", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Determine sale type based on items
      const hasProducts = selectedItems.some(item => item.type === "product");
      const hasServices = selectedItems.some(item => item.type === "service");
      
      let saleType: "product" | "service" | "mixed";
      if (hasProducts && hasServices) {
        saleType = "mixed";
      } else if (hasProducts) {
        saleType = "product";
      } else {
        saleType = "service";
      }

      // Get client name if a client is selected
      let clientName = null;
      if (selectedClient !== 'no_client') {
        const client = clients.find(c => c.id === selectedClient);
        clientName = client?.name || null;
      }

      // Calculate final values for products and services
      const finalProductsValue = hasProducts ? finalProductsTotal() : 0;
      const finalServicesValue = hasServices ? finalServicesTotal() : 0;

      // Create the sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user?.id,
          client_id: selectedClient !== 'no_client' ? selectedClient : null,
          client_name: clientName,
          total: totalAmount,
          subtotal: subtotal,
          discount: discountAmount,
          surcharge: surchargeAmount,
          type: saleType,
          sale_date: new Date().toISOString(),
          payment_method: 'cash' // Default payment method
        })
        .select()
        .single();

      if (saleError) {
        console.error("Error saving sale:", saleError);
        throw saleError;
      }

      // Create sale items
      const saleItems = selectedItems.map(item => ({
        sale_id: saleData.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        product_id: item.type === 'product' ? item.id : null,
        service_id: item.type === 'service' ? item.id : null,
        type: item.type
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock if applicable
      for (const item of selectedItems) {
        if (item.type === 'product') {
          const product = products.find(p => p.id === item.id);
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.id)
              .eq('user_id', user?.id);
          }
        }
      }

      toast({ title: "Venda registrada com sucesso!" });
      onComplete();
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
          <ItemSelector 
            products={products} 
            services={services}
            onAddItem={handleAddItem}
          />

          <div className="space-y-6">
            <SaleItemsList 
              items={selectedItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
            />
            
            {selectedItems.length > 0 && (
              <SaleDiscountForm
                items={selectedItems}
                onDiscountChange={setDiscount}
                onSurchargeChange={setSurcharge}
              />
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
          disabled={selectedItems.length === 0 || loading || discountAmount > subtotal}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Salvando..." : "Finalizar venda"}
        </Button>
      </div>
    </>
  );
}
