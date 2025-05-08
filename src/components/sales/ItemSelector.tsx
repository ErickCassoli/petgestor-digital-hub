
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, ShoppingBag, FileText } from "lucide-react";
import { SaleFormItem } from "@/types/sales";

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

interface ItemSelectorProps {
  products: Product[];
  services: Service[];
  onAddItem: (item: SaleFormItem) => void;
}

export default function ItemSelector({ products, services, onAddItem }: ItemSelectorProps) {
  const [activeTab, setActiveTab] = useState<"products" | "services">("products");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (item: Product | Service, type: "product" | "service") => {
    onAddItem({
      type,
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  };

  return (
    <div>
      <div className="mb-4">
        <Label>Adicionar itens</Label>
        <div className="flex gap-2 mt-1">
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "products" | "services")}>
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

        <TabsContent value="products" className="max-h-[300px] overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {searchTerm
                ? "Nenhum produto encontrado com esse termo."
                : "Nenhum produto cadastrado."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-2 border rounded hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Estoque: {product.stock} | R$ {product.price.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddItem(product, "product")}
                    disabled={product.stock < 1}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="max-h-[300px] overflow-y-auto">
          {filteredServices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {searchTerm
                ? "Nenhum serviço encontrado com esse termo."
                : "Nenhum serviço cadastrado."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="flex justify-between items-center p-2 border rounded hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {service.duration} min | R$ {service.price.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddItem(service, "service")}
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
