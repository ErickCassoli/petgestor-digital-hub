import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, Minus, X, Trash2, ShoppingBag, Scissors, Save, Loader2 } from "lucide-react";
import DiscountSurchargeForm from "./sales/DiscountSurchargeForm";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SaleFormData } from "@/types/sales";

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
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedItems, setSelectedItems] = useState<SaleFormData['items']>([]);
  const [selectedClient, setSelectedClient] = useState<string>('no_client');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [discountProducts, setDiscountProducts] = useState(0);
  const [surchargeProducts, setSurchargeProducts] = useState(0);
  const [discountServices, setDiscountServices] = useState(0);
  const [surchargeServices, setSurchargeServices] = useState(0);
  const [notes, setNotes] = useState('');

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
  const productsSubtotal = selectedItems
    .filter(item => item.type === 'product')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const servicesSubtotal = selectedItems
    .filter(item => item.type === 'service')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Calculate total with discounts and surcharges
  const finalTotal = 
    (productsSubtotal - discountProducts + surchargeProducts) + 
    (servicesSubtotal - discountServices + surchargeServices);

  const handleAddItem = (item: Product | Service, type: 'product' | 'service') => {
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
    
    // If we add an item of a different type than the active tab, switch to mixed view
    if ((type === 'product' && activeTab === 'services' && servicesSubtotal === 0) || 
        (type === 'service' && activeTab === 'products' && productsSubtotal === 0)) {
      setActiveTab(type === 'product' ? 'products' : 'services');
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

  const validateSale = () => {
    if (selectedItems.length === 0) {
      toast({ 
        title: "Adicione pelo menos um item para concluir a venda", 
        variant: "destructive" 
      });
      return false;
    }

    if (discountProducts > productsSubtotal) {
      toast({ 
        title: "O desconto de produtos não pode ser maior que o valor total dos produtos", 
        variant: "destructive" 
      });
      return false;
    }

    if (discountServices > servicesSubtotal) {
      toast({ 
        title: "O desconto de serviços não pode ser maior que o valor total dos serviços", 
        variant: "destructive" 
      });
      return false;
    }

    // Check product stock
    for (const item of selectedItems.filter(i => i.type === 'product')) {
      const product = products.find(p => p.id === item.itemId);
      if (product && product.stock < item.quantity) {
        toast({ 
          title: `Estoque insuficiente para o produto "${product.name}"`,
          description: `Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
          variant: "destructive" 
        });
        return false;
      }
    }

    return true;
  };

  const handleSaveSale = async () => {
    if (!validateSale()) return;

    setLoading(true);
    try {
      // Determine sale type based on items
      const hasProducts = selectedItems.some(item => item.type === 'product');
      const hasServices = selectedItems.some(item => item.type === 'service');
      
      // Set the type based on what's in the sale
      let saleType: "product" | "service" | "mixed";
      if (hasProducts && hasServices) {
        saleType = "mixed";
      } else if (hasProducts) {
        saleType = "product";
      } else {
        saleType = "service";
      }

      // Create the sale record with both new structure and legacy fields for compatibility
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user?.id,
          client_id: selectedClient !== 'no_client' ? selectedClient : null,
          total_products: productsSubtotal,
          discount_products: discountProducts,
          surcharge_products: surchargeProducts,
          total_services: servicesSubtotal,
          discount_services: discountServices,
          surcharge_services: surchargeServices,
          final_total: finalTotal,
          notes: notes || null,
          sale_date: new Date().toISOString(),
          type: saleType,
          // Legacy fields for compatibility
          total: finalTotal,
          discount_amount: discountProducts + discountServices,
          surcharge_amount: surchargeProducts + surchargeServices,
          subtotal: productsSubtotal + servicesSubtotal
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items with the updated structure
      const saleItems = selectedItems.map(item => ({
        sale_id: saleData.id,
        product_id: item.type === 'product' ? item.itemId : null,
        service_id: item.type === 'service' ? item.itemId : null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        type: item.type,
        item_name: item.name,
        // Legacy field for compatibility
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock if applicable
      for (const item of selectedItems) {
        if (item.type === 'product') {
          const product = products.find(p => p.id === item.itemId);
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await supabase
              .from('products')
              .update({ 
                stock: newStock,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.itemId)
              .eq('user_id', user?.id);
          }
        }
      }

      toast({ 
        title: "Venda registrada com sucesso!",
        variant: "default"
      });
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

  // Count items by type
  const productCount = selectedItems.filter(item => item.type === 'product').length;
  const serviceCount = selectedItems.filter(item => item.type === 'service').length;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova Venda</DialogTitle>
        <DialogDescription>Registre uma nova venda de produtos e/ou serviços</DialogDescription>
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

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'products' | 'services')}>
              <TabsList className="w-full mb-4">
                <TabsTrigger 
                  value="products" 
                  className="flex-1"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Produtos
                </TabsTrigger>
                <TabsTrigger 
                  value="services" 
                  className="flex-1"
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  Serviços
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="max-h-[300px] overflow-y-auto">
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
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>
                              Estoque: <span className={product.stock <= 0 ? "text-destructive font-medium" : ""}>
                                {product.stock}
                              </span>
                            </span>
                            <span>|</span>
                            <span>{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleAddItem(product, 'product')}
                          disabled={product.stock <= 0}
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
                      : "Nenhum serviço cadastrado."
                    }
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredServices.map(service => (
                      <div key={service.id} className="flex justify-between items-center p-2 border rounded hover:bg-muted/50">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{service.duration} min</span>
                            <span>|</span>
                            <span>{service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
              <div className="p-3 bg-muted rounded-t-md font-medium flex justify-between items-center">
                <span>Itens selecionados</span>
                <div className="flex gap-2">
                  {productCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" />
                      {productCount}
                    </span>
                  )}
                  {serviceCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                      <Scissors className="h-3 w-3" />
                      {serviceCount}
                    </span>
                  )}
                </div>
              </div>
              
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
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.type === 'product' ? 'Produto' : 'Serviço'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                totalProducts={productsSubtotal}
                totalServices={servicesSubtotal}
                discountProducts={discountProducts}
                surchargeProducts={surchargeProducts}
                discountServices={discountServices}
                surchargeServices={surchargeServices}
                onDiscountProductsChange={setDiscountProducts}
                onSurchargeProductsChange={setSurchargeProducts}
                onDiscountServicesChange={setDiscountServices}
                onSurchargeServicesChange={setSurchargeServices}
                className="p-4 border-t"
              />
            </div>

            <div className="mt-4">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea 
                id="notes"
                placeholder="Observações sobre a venda..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none mt-1"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button 
          onClick={handleSaveSale} 
          disabled={
            selectedItems.length === 0 || 
            loading || 
            discountProducts > productsSubtotal ||
            discountServices > servicesSubtotal
          }
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Finalizar venda
            </>
          )}
        </Button>
      </div>
    </>
  );
}
