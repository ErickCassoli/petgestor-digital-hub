
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, Minus, X, Trash2, ShoppingBag, FileText, Save } from "lucide-react";
import DiscountSurchargeForm from "./sales/DiscountSurchargeForm";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

interface SaleItem {
  id?: string;
  type: 'product' | 'service';
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface SaleFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function SaleForm({ onComplete, onCancel }: SaleFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('no_client');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [surchargeAmount, setSurchargeAmount] = useState(0);
  const [currentType, setCurrentType] = useState<'product' | 'service'>('product');

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

  // Calculate subtotal
  const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Calculate total with discounts and surcharges
  const totalAmount = subtotal - discountAmount + surchargeAmount;

  const handleAddItem = (item: Product | Service, type: 'product' | 'service') => {
    // Check if we're mixing types
    if (selectedItems.length > 0) {
      const existingType = selectedItems[0].type;
      if (type !== existingType) {
        toast({
          title: "Tipo de item inválido",
          description: `Esta venda já contém ${existingType === 'product' ? 'produtos' : 'serviços'}. Não é possível misturar tipos.`,
          variant: "destructive"
        });
        return;
      }
    } else {
      setCurrentType(type);
    }

    // Check if item already exists in the cart
    const existingItemIndex = selectedItems.findIndex(
      i => i.itemId === item.id && i.type === type
    );

    if (existingItemIndex >= 0) {
      // Increment quantity if item already exists
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      // Add new item with quantity 1
      setSelectedItems([
        ...selectedItems,
        {
          type,
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        }
      ]);
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

    if (discountAmount > subtotal) {
      toast({ title: "O desconto não pode ser maior que o valor total", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Determine sale type based on first item
      const saleType = selectedItems[0].type;

      // Create the sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user?.id,
          client_id: selectedClient !== 'no_client' ? selectedClient : null,
          total: totalAmount,
          subtotal: subtotal,
          discount_amount: discountAmount,
          surcharge_amount: surchargeAmount,
          type: saleType,
          sale_date: new Date().toISOString()
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = selectedItems.map(item => ({
        sale_id: saleData.id,
        price: item.price,
        quantity: item.quantity,
        product_id: item.type === 'product' ? item.itemId : null,
        service_id: item.type === 'service' ? item.itemId : null
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock if applicable
      if (saleType === 'product') {
        for (const item of selectedItems) {
          const product = products.find(p => p.id === item.itemId);
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.itemId)
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

  // Filter items based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div>
            <div className="mb-4">
              <Label>Adicionar itens ({currentType === 'product' ? 'Produtos' : 'Serviços'})</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <Tabs value={currentType} onValueChange={(v) => {
              if (selectedItems.length === 0) {
                setCurrentType(v as 'product' | 'service');
              }
            }}>
              <TabsList className="w-full mb-4">
                <TabsTrigger 
                  value="product" 
                  className="flex-1"
                  disabled={selectedItems.length > 0 && currentType !== 'product'}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Produtos
                </TabsTrigger>
                <TabsTrigger 
                  value="service" 
                  className="flex-1"
                  disabled={selectedItems.length > 0 && currentType !== 'service'}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Serviços
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="product" className="max-h-[300px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm 
                      ? "Nenhum produto encontrado com esse termo."
                      : "Nenhum produto cadastrado."
                    }
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map(product => (
                      <div key={product.id} className="flex justify-between items-center p-2 border rounded hover:bg-muted/50">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Estoque: {product.stock} | R$ {product.price.toFixed(2)}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleAddItem(product, 'product')}
                          disabled={product.stock < 1}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="service" className="max-h-[300px] overflow-y-auto">
                {filteredServices.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm 
                      ? "Nenhum serviço encontrado com esse termo."
                      : "Nenhum serviço cadastrado."
                    }
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredServices.map(service => (
                      <div key={service.id} className="flex justify-between items-center p-2 border rounded hover:bg-muted/50">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {service.duration} min | R$ {service.price.toFixed(2)}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleAddItem(service, 'service')}
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

          <div>
            <Label>Itens da venda</Label>
            <div className="border rounded-md mt-1">
              <div className="p-3 bg-muted rounded-t-md font-medium">Resumo da venda</div>
              
              {selectedItems.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Adicione itens à venda
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border-t">
                      <div className="flex-1">
                        <div className="font-medium flex items-center">
                          {item.name}
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted">
                            {item.type === 'product' ? 'Produto' : 'Serviço'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          R$ {item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7"
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <DiscountSurchargeForm
                subtotal={subtotal}
                discountAmount={discountAmount}
                surchargeAmount={surchargeAmount}
                onDiscountChange={setDiscountAmount}
                onSurchargeChange={setSurchargeAmount}
                className="p-4 border-t"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSaveSale} disabled={selectedItems.length === 0 || loading || discountAmount > subtotal}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Salvando..." : "Finalizar venda"}
        </Button>
      </div>
    </>
  );
}
