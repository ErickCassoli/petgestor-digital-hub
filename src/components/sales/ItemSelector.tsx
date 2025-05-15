import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, ShoppingBag, FileText } from "lucide-react";
import { CartItem, Product, Service } from "@/types/sales";
import { cn } from "@/lib/utils";

interface ItemSelectorProps {
  products: Product[];
  services: Service[];
  onAddItem: (item: CartItem) => void;
}

export function ItemSelector({ products, services, onAddItem }: ItemSelectorProps) {
  const [activeTab, setActiveTab] = useState<"products" | "services">("products");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (prod: Product) => {
    if (prod.stock <= 0) return;
    onAddItem({
      id: prod.id,
      type: "product",
      name: prod.name,
      price: prod.price,
      quantity: prod.type === 2 ? 0.1 : 1,
      unitType: prod.type,
    });
  };

  const handleAddService = (srv: Service) => {
    onAddItem({
      id: srv.id,
      type: "service",
      name: srv.name,
      price: srv.price,
      quantity: 1,
    });
  };

  return (
    <div className="space-y-4">
      <Label>Adicionar itens</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="mt-2">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="products" className="flex-1">
            <ShoppingBag className="h-4 w-4 mr-2" /> Produtos
          </TabsTrigger>
          <TabsTrigger value="services" className="flex-1">
            <FileText className="h-4 w-4 mr-2" /> Serviços
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="border rounded p-1">
          {filteredProducts.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              {searchTerm ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
            </div>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {filteredProducts.map(prod => (
                <div
                  key={prod.id}
                  className={cn(
                    "flex justify-between items-center p-2 rounded hover:bg-muted/50",
                    prod.stock <= 0 && "opacity-50"
                  )}
                >
                  <div>
                    <div className="font-medium">{prod.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Estoque: {prod.stock} |{" "}
                      {prod.price.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleAddProduct(prod)} disabled={prod.stock <= 0}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="border rounded p-1">
          {filteredServices.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              {searchTerm ? "Nenhum serviço encontrado." : "Nenhum serviço cadastrado."}
            </div>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {filteredServices.map(srv => (
                <div key={srv.id} className="flex justify-between items-center p-2 rounded hover:bg-muted/50">
                  <div>
                    <div className="font-medium">{srv.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {srv.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleAddService(srv)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
