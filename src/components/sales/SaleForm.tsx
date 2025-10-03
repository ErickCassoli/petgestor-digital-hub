// src/components/sales/SaleForm.tsx

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { X, Save } from "lucide-react";
import { CartItem, Product, Service } from "@/types/sales";
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

export function SaleForm({
  onComplete,
  onCancel,
}: {
  onComplete(): void;
  onCancel(): void;
}) {
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
  const [clientQuery, setClientQuery] = useState<string>("");
  const [showClientSuggestions, setShowClientSuggestions] =
    useState<boolean>(false);

  const fetchClients = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name");

    if (error) {
      console.error("Erro ao buscar clientes:", error);
      return;
    }
    setClients(data || []);
  }, [user?.id]);

  const fetchProducts = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (error) {
      console.error("Erro ao buscar produtos:", error);
      return;
    }
    setProducts((data || []) as Product[]);
  }, [user?.id]);

  const fetchServices = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price, description")
      .eq("user_id", user.id)
      .order("name");

    if (error) {
      console.error("Erro ao buscar servi�os:", error);
      return;
    }
    setServices(data || []);
  }, [user?.id]);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchServices();
  }, [fetchClients, fetchProducts, fetchServices]);

  function handleAddItem(item: CartItem) {
    const idx = cartItems.findIndex(
      (i) => i.id === item.id && i.type === item.type
    );
    if (idx >= 0) {
      const updated = [...cartItems];
      updated[idx].quantity += item.quantity;
      updated[idx].total = updated[idx].price * updated[idx].quantity;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          ...item,
          total: item.price * item.quantity,
          discount: 0,
          surcharge: 0,
        },
      ]);
    }
  }

  function handleRemoveItem(i: number) {
    setCartItems((ci) => ci.filter((_, idx) => idx !== i));
  }

  function handleUpdateQuantity(idx: number, qty: number) {
    const item = cartItems[idx];
    // tipo 1 = unidade (>=1); tipo 2 = peso (>0)
    if (item.unitType === 1 && qty < 1) return;
    if (item.unitType === 2 && qty <= 0) return;

    const updated = [...cartItems];
    updated[idx].quantity = qty;
    updated[idx].total = updated[idx].price * qty;
    setCartItems(updated);
  }

  function handleUpdateDiscount(idx: number, discount: number) {
    const updated = [...cartItems];
    updated[idx].discount = discount;
    const base = updated[idx].price * updated[idx].quantity;
    updated[idx].total = base - discount + (updated[idx].surcharge || 0);
    setCartItems(updated);
  }

  function handleUpdateSurcharge(idx: number, surcharge: number) {
    const updated = [...cartItems];
    updated[idx].surcharge = surcharge;
    const base = updated[idx].price * updated[idx].quantity;
    updated[idx].total = base - (updated[idx].discount || 0) + surcharge;
    setCartItems(updated);
  }

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemDiscountsTotal = cartItems.reduce(
    (sum, i) => sum + (i.discount || 0),
    0
  );
  const itemSurchargesTotal = cartItems.reduce(
    (sum, i) => sum + (i.surcharge || 0),
    0
  );
  const total = subtotal - itemDiscountsTotal + itemSurchargesTotal;

  const productSubtotal = cartItems
    .filter((i) => i.type === "product")
    .reduce((sum, i) => sum + i.price * i.quantity, 0);
  const serviceSubtotal = cartItems
    .filter((i) => i.type === "service")
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function handleSaveSale() {
    if (cartItems.length === 0) {
      toast({ variant: "destructive", title: "Adicione pelo menos um item" });
      return;
    }
    setLoading(true);
    try {
      const clientId =
        selectedClient !== "no_client" ? selectedClient : null;
      const clientName = clientId
        ? clients.find((c) => c.id === clientId)?.name || null
        : null;

      const result = await createSale(
        cartItems,
        subtotal,
        itemDiscountsTotal,
        itemSurchargesTotal,
        total,
        clientId,
        clientName,
        "cash",
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
  }

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientQuery.toLowerCase())
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova Venda</DialogTitle>
        <DialogDescription>
          Adicione produtos ou serviços para registrar uma nova venda
        </DialogDescription>
        {/* Autocomplete Cliente */}
        <div className="relative mb-6">
          <Label htmlFor="client">Cliente (opcional)</Label>
          <input
            id="client"
            type="text"
            className="input w-full"
            value={clientQuery}
            onChange={(e) => {
              setClientQuery(e.target.value);
              setShowClientSuggestions(true);
              setSelectedClient("no_client");
            }}
            onFocus={() => setShowClientSuggestions(true)}
            onBlur={() =>
              setTimeout(() => setShowClientSuggestions(false), 200)
            }
            placeholder="Digite para buscar..."
            disabled={loading}
          />
          <input type="hidden" value={selectedClient} />
          {showClientSuggestions && filteredClients.length > 0 && (
            <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto mt-1 rounded">
              {filteredClients.map((c) => (
                <li
                  key={c.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => {
                    setClientQuery(c.name);
                    setSelectedClient(c.id);
                    setShowClientSuggestions(false);
                  }}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogHeader>

      <div className="grid gap-6 py-4">
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
                className="h-[100px]"
                placeholder="Adicione observações sobre a venda"
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
          <X className="h-4 w-4 mr-2" /> Cancelar
        </Button>
        <Button
          onClick={handleSaveSale}
          disabled={cartItems.length === 0 || loading}
        >
          <Save className="h-4 w-4 mr-2" />{" "}
          {loading ? "Salvando..." : "Finalizar venda"}
        </Button>
      </div>
    </>
  );
}

