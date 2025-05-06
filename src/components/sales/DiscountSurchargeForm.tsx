
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DiscountSurchargeFormProps {
  totalProducts: number;
  totalServices: number;
  discountProducts: number;
  surchargeProducts: number;
  discountServices: number;
  surchargeServices: number;
  onDiscountProductsChange: (value: number) => void;
  onSurchargeProductsChange: (value: number) => void;
  onDiscountServicesChange: (value: number) => void;
  onSurchargeServicesChange: (value: number) => void;
  className?: string;
}

export default function DiscountSurchargeForm({
  totalProducts,
  totalServices,
  discountProducts,
  surchargeProducts,
  discountServices,
  surchargeServices,
  onDiscountProductsChange,
  onSurchargeProductsChange,
  onDiscountServicesChange,
  onSurchargeServicesChange,
  className
}: DiscountSurchargeFormProps) {
  const [discountProductsValue, setDiscountProductsValue] = useState<string>(discountProducts.toString());
  const [surchargeProductsValue, setSurchargeProductsValue] = useState<string>(surchargeProducts.toString());
  const [discountServicesValue, setDiscountServicesValue] = useState<string>(discountServices.toString());
  const [surchargeServicesValue, setSurchargeServicesValue] = useState<string>(surchargeServices.toString());
  const [activeTab, setActiveTab] = useState<string>(totalProducts > 0 ? "products" : "services");
  
  // Update local state when props change
  useEffect(() => {
    setDiscountProductsValue(discountProducts.toString());
  }, [discountProducts]);
  
  useEffect(() => {
    setSurchargeProductsValue(surchargeProducts.toString());
  }, [surchargeProducts]);
  
  useEffect(() => {
    setDiscountServicesValue(discountServices.toString());
  }, [discountServices]);
  
  useEffect(() => {
    setSurchargeServicesValue(surchargeServices.toString());
  }, [surchargeServices]);
  
  useEffect(() => {
    // Auto-select the appropriate tab based on what items exist
    if (totalProducts > 0 && totalServices === 0) {
      setActiveTab("products");
    } else if (totalProducts === 0 && totalServices > 0) {
      setActiveTab("services");
    }
  }, [totalProducts, totalServices]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleDiscountProductsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDiscountProductsValue(inputValue);
    
    // Convert to number and update parent component if valid
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onDiscountProductsChange(numValue);
    }
  };

  const handleSurchargeProductsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSurchargeProductsValue(inputValue);
    
    // Convert to number and update parent component if valid
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onSurchargeProductsChange(numValue);
    }
  };

  const handleDiscountServicesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDiscountServicesValue(inputValue);
    
    // Convert to number and update parent component if valid
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onDiscountServicesChange(numValue);
    }
  };

  const handleSurchargeServicesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSurchargeServicesValue(inputValue);
    
    // Convert to number and update parent component if valid
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onSurchargeServicesChange(numValue);
    }
  };

  // Calculate discount and surcharge amounts
  const discountProductsAmt = parseFloat(discountProductsValue) || 0;
  const surchargeProductsAmt = parseFloat(surchargeProductsValue) || 0;
  const discountServicesAmt = parseFloat(discountServicesValue) || 0;
  const surchargeServicesAmt = parseFloat(surchargeServicesValue) || 0;
  
  // Calculate totals properly
  const totalProductsNet = Math.max(0, totalProducts - discountProductsAmt) + surchargeProductsAmt;
  const totalServicesNet = Math.max(0, totalServices - discountServicesAmt) + surchargeServicesAmt;
  const finalTotal = totalProductsNet + totalServicesNet;
  
  // Check if discounts are valid
  const isProductDiscountValid = discountProductsAmt <= totalProducts;
  const isServiceDiscountValid = discountServicesAmt <= totalServices;

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger 
            value="products" 
            disabled={totalProducts === 0}
            className="relative"
          >
            Produtos
            {!isProductDiscountValid && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="services"
            disabled={totalServices === 0}
            className="relative"
          >
            Serviços
            {!isServiceDiscountValid && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex justify-between">
                <span>Desconto Produtos (R$)</span>
                {!isProductDiscountValid && <span className="text-red-500 text-xs">Maior que o subtotal</span>}
              </Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={discountProductsValue}
                onChange={handleDiscountProductsChange}
                className={cn("font-mono", !isProductDiscountValid && "border-red-500")}
                disabled={totalProducts === 0}
              />
            </div>
            <div>
              <Label>Acréscimo Produtos (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={surchargeProductsValue}
                onChange={handleSurchargeProductsChange}
                className="font-mono"
                disabled={totalProducts === 0}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="services" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex justify-between">
                <span>Desconto Serviços (R$)</span>
                {!isServiceDiscountValid && <span className="text-red-500 text-xs">Maior que o subtotal</span>}
              </Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={discountServicesValue}
                onChange={handleDiscountServicesChange}
                className={cn("font-mono", !isServiceDiscountValid && "border-red-500")}
                disabled={totalServices === 0}
              />
            </div>
            <div>
              <Label>Acréscimo Serviços (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={surchargeServicesValue}
                onChange={handleSurchargeServicesChange}
                className="font-mono"
                disabled={totalServices === 0}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="border rounded-md p-4 space-y-2 bg-muted/50">
        {totalProducts > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span>Subtotal Produtos:</span>
              <span className="font-mono">{formatCurrency(totalProducts)}</span>
            </div>
            {discountProductsAmt > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Desconto Produtos:</span>
                <span className="font-mono">-{formatCurrency(discountProductsAmt)}</span>
              </div>
            )}
            {surchargeProductsAmt > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Acréscimo Produtos:</span>
                <span className="font-mono">+{formatCurrency(surchargeProductsAmt)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium">
              <span>Total Produtos:</span>
              <span className="font-mono">{formatCurrency(totalProductsNet)}</span>
            </div>
          </>
        )}
        
        {totalServices > 0 && (
          <>
            {totalProducts > 0 && <div className="border-t my-2"></div>}
            
            <div className="flex justify-between text-sm">
              <span>Subtotal Serviços:</span>
              <span className="font-mono">{formatCurrency(totalServices)}</span>
            </div>
            {discountServicesAmt > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Desconto Serviços:</span>
                <span className="font-mono">-{formatCurrency(discountServicesAmt)}</span>
              </div>
            )}
            {surchargeServicesAmt > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Acréscimo Serviços:</span>
                <span className="font-mono">+{formatCurrency(surchargeServicesAmt)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium">
              <span>Total Serviços:</span>
              <span className="font-mono">{formatCurrency(totalServicesNet)}</span>
            </div>
          </>
        )}
        
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between font-medium">
            <span>Total Final:</span>
            <span className="font-mono text-lg">{formatCurrency(finalTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
