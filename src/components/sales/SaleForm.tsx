import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { X, Save } from "lucide-react";
import { CartItem } from "@/types/sales";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const [selectedClient, setSelectedClient] = useState<string>("no_client");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchServices();
  }, []);

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name");
    setClients(data || []);
  };

  const fetchProducts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("products")
      .select("id, name, price, stock")
      .eq("user_id", user.id)
      .order("name");
    setProducts(data || []);
  };

  const fetchServices = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("services")
      .select("id, name, price, description")
      .eq("user_id", user.id)
      .order("name");
    setServices(data || []);
  };

  const handleAddItem = (item: CartItem) => {
    // estoque & combinação já implementados...
    const idx = cartItems.findIndex(
      (i) => i.id === item.id && i.type === item.type
    );
    if (idx >= 0) {
      // incrementa quantidade e total...
      const updated = [...cartItems];
      updated[idx].quantity += 1;
      updated[idx].total = updated[idx].price * updated[idx].quantity;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        { ...item, total: item.price * item.quantity, discount: 0, surcharge: 0 },
      ]);
    }
  };

  const handleRemoveItem = (i: number) =>
    setCartItems(cartItems.filter((_, idx) => idx !== i));

  const handleUpdateQuantity = (idx: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...cartItems];
    updated[idx].quantity = qty;
    updated[idx].total = updated[idx].price * qty;
    setCartItems(updated);
  };

  const handleUpdateDiscount = (idx: number, discount: number) => {
    const updated = [...cartItems];
    updated[idx].discount = discount;
    const base = updated[idx].price * updated[idx].quantity;
    updated[idx].total = base - discount + (updated[idx].surcharge || 0);
    setCartItems(updated);
  };

  const handleUpdateSurcharge = (idx: number, surcharge: number) => {
    const updated = [...cartItems];
    updated[idx].surcharge = surcharge;
    const base = updated[idx].price * updated[idx].quantity;
    updated[idx].total = base - (updated[idx].discount || 0) + surcharge;
    setCartItems(updated);
  };

  // 1) subtotal bruto
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // 2) total de descontos *individuais*
  const itemDiscountsTotal = cartItems.reduce((sum, i) => sum + (i.discount || 0), 0);
  // 3) total de acréscimos *individuais*
  const itemSurchargesTotal = cartItems.reduce((sum, i) => sum + (i.surcharge || 0), 0);
  // 4) total final
  const total = subtotal - itemDiscountsTotal + itemSurchargesTotal;

  // subtotais por tipo (para exibir no resumo)
  const productSubtotal = cartItems
    .filter((i) => i.type === "product")
    .reduce((sum, i) => sum + i.price * i.quantity, 0);
  const serviceSubtotal = cartItems
    .filter((i) => i.type === "service")
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSaveSale = async () => {
    if (cartItems.length === 0) {
      toast({ variant: "destructive", title: "Adicione pelo menos um item" });
      return;
    }

    setLoading(true);
    try {
      let clientId: string | null = null;
      let clientName: string | null = null;
      if (selectedClient !== "no_client") {
        clientId = selectedClient;
        clientName = clients.find((c) => c.id === selectedClient)?.name || null;
      }

      // **Aqui passamos, explicitamente, os totais de desconto e acréscimo individuais:**
      const result = await createSale(
        cartItems,
        subtotal,
        itemDiscountsTotal,   // ← total de *todos* os discounts individuais
        itemSurchargesTotal,  // ← total de *todos* os surcharges individuais
        total,
        clientId,
        clientName,
        "cash", // método de pagamento default
        notes || null
      );

      if (result) onComplete();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erro ao registrar venda",
        description: "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova Venda</DialogTitle>
        <DialogDescription>
          Adicione produtos ou serviços para registrar uma nova venda
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-4">
        {/* … cliente, selector, notas … */}
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
              <SaleSummary
                items={cartItems}
                subtotal={subtotal}
                discount={itemDiscountsTotal}
                surcharge={itemSurchargesTotal}
                total={total}
                productSubtotal={productSubtotal}
                serviceSubtotal={serviceSubtotal}
                itemDiscounts={itemDiscountsTotal}
                itemSurcharges={itemSurchargesTotal}
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
          disabled={cartItems.length === 0 || loading}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Salvando..." : "Finalizar venda"}
        </Button>
      </div>
    </>
  );
}