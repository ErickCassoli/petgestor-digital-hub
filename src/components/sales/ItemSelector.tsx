
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, ShoppingBag, FileText } from "lucide-react";
import { CartItem } from "@/types/sales";

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
}

interface ItemSelectorProps {
  products: Product[];
  services: Service[];
  onAddItem: (item: CartItem) => void;
}

export function ItemSelector({ products, services, onAddItem }: ItemSelectorProps) {
  const [activeTab, setActiveTab] = useState<"products" | "services">("products");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (product: Product) => {
    if (product.stock <= 0) return;

    onAddItem({
      id: product.id,
      type: "product",
      name: product.name,
      price: product.price,
      quantity: 1
    });
  };

  const handleAddService = (service: Service) => {
    onAddItem({
      id: service.id,
      type: "service",
      name: service.name,
      price: service.price,
      quantity: 1
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Adicionar itens</Label>
        <div className="flex gap-2 mt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as "products" | "services")}
        className="mt-2"
      >
        <TabsList className="w-full mb-4">
          <TabsTrigger value="products" className="flex-1">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="services" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Serviços
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="border rounded-md p-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {searchTerm
                ? "Nenhum produto encontrado."
                : "Nenhum produto cadastrado."}
            </div>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={cn(
                    "flex justify-between items-center p-2 rounded hover:bg-muted/50",
                    product.stock <= 0 && "opacity-50"
                  )}
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Estoque: {product.stock} | {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddProduct(product)}
                    disabled={product.stock <= 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="border rounded-md p-1">
          {filteredServices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {searchTerm
                ? "Nenhum serviço encontrado."
                : "Nenhum serviço cadastrado."}
            </div>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="flex justify-between items-center p-2 rounded hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddService(service)}
                  >
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

// Import the cn utility
import { cn } from "@/lib/utils";
