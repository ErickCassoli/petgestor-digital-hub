
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SaleFormItem } from "@/types/sales";

interface SaleDiscountFormProps {
  items: SaleFormItem[];
  onDiscountChange: (values: { total: number; products: number; services: number }) => void;
  onSurchargeChange: (values: { total: number; products: number; services: number }) => void;
  className?: string;
}

export default function SaleDiscountForm({
  items,
  onDiscountChange,
  onSurchargeChange,
  className,
}: SaleDiscountFormProps) {
  const [activeTab, setActiveTab] = useState("total");
  const [discountTotal, setDiscountTotal] = useState("0");
  const [discountProducts, setDiscountProducts] = useState("0");
  const [discountServices, setDiscountServices] = useState("0");
  const [surchargeTotal, setSurchargeTotal] = useState("0");
  const [surchargeProducts, setSurchargeProducts] = useState("0");
  const [surchargeServices, setSurchargeServices] = useState("0");

  // Calculate subtotals
  const subtotalProducts = items
    .filter(item => item.type === "product")
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const subtotalServices = items
    .filter(item => item.type === "service")
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const subtotalTotal = subtotalProducts + subtotalServices;

  // Validate and convert inputs
  const validateDiscount = (value: string, subtotal: number): number => {
    const num = value.trim() === "" ? 0 : parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= subtotal ? num : 0;
  };

  const validateSurcharge = (value: string): number => {
    const num = value.trim() === "" ? 0 : parseFloat(value);
    return !isNaN(num) && num >= 0 ? num : 0;
  };

  // Update parent when discount or surcharge changes
  useEffect(() => {
    const discTotal = validateDiscount(discountTotal, subtotalTotal);
    const discProducts = validateDiscount(discountProducts, subtotalProducts);
    const discServices = validateDiscount(discountServices, subtotalServices);
    
    onDiscountChange({
      total: activeTab === "total" ? discTotal : 0,
      products: activeTab === "separate" ? discProducts : 0,
      services: activeTab === "separate" ? discServices : 0,
    });
  }, [discountTotal, discountProducts, discountServices, activeTab, subtotalTotal, subtotalProducts, subtotalServices, onDiscountChange]);

  useEffect(() => {
    const surTotal = validateSurcharge(surchargeTotal);
    const surProducts = validateSurcharge(surchargeProducts);
    const surServices = validateSurcharge(surchargeServices);
    
    onSurchargeChange({
      total: activeTab === "total" ? surTotal : 0,
      products: activeTab === "separate" ? surProducts : 0,
      services: activeTab === "separate" ? surServices : 0,
    });
  }, [surchargeTotal, surchargeProducts, surchargeServices, activeTab, onSurchargeChange]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Calculate final totals
  const discTotalValue = validateDiscount(discountTotal, subtotalTotal);
  const discProductsValue = validateDiscount(discountProducts, subtotalProducts);
  const discServicesValue = validateDiscount(discountServices, subtotalServices);
  
  const surTotalValue = validateSurcharge(surchargeTotal);
  const surProductsValue = validateSurcharge(surchargeProducts);
  const surServicesValue = validateSurcharge(surchargeServices);

  const finalTotal = activeTab === "total"
    ? subtotalTotal - discTotalValue + surTotalValue
    : (subtotalProducts - discProductsValue + surProductsValue) + 
      (subtotalServices - discServicesValue + surServicesValue);

  const hasProducts = items.some(item => item.type === "product");
  const hasServices = items.some(item => item.type === "service");
  const showSeparate = hasProducts && hasServices;

  // Conteúdo dos tabs
  const renderTotalTabContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="flex justify-between">
          <span>Desconto Total (R$)</span>
          {discTotalValue > subtotalTotal && (
            <span className="text-red-500 text-xs">Maior que o subtotal</span>
          )}
        </Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={discountTotal}
          onChange={(e) => setDiscountTotal(e.target.value)}
          className={cn(
            "font-mono",
            discTotalValue > subtotalTotal && "border-red-500"
          )}
        />
      </div>
      <div>
        <Label>Acréscimo Total (R$)</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={surchargeTotal}
          onChange={(e) => setSurchargeTotal(e.target.value)}
          className="font-mono"
        />
      </div>
    </div>
  );

  const renderSeparateTabContent = () => (
    <>
      {hasProducts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="flex justify-between">
              <span>Desconto Produtos (R$)</span>
              {discProductsValue > subtotalProducts && (
                <span className="text-red-500 text-xs">Maior que o subtotal</span>
              )}
            </Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={discountProducts}
              onChange={(e) => setDiscountProducts(e.target.value)}
              className={cn(
                "font-mono",
                discProductsValue > subtotalProducts && "border-red-500"
              )}
            />
          </div>
          <div>
            <Label>Acréscimo Produtos (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={surchargeProducts}
              onChange={(e) => setSurchargeProducts(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>
      )}

      {hasServices && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="flex justify-between">
              <span>Desconto Serviços (R$)</span>
              {discServicesValue > subtotalServices && (
                <span className="text-red-500 text-xs">Maior que o subtotal</span>
              )}
            </Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={discountServices}
              onChange={(e) => setDiscountServices(e.target.value)}
              className={cn(
                "font-mono",
                discServicesValue > subtotalServices && "border-red-500"
              )}
            />
          </div>
          <div>
            <Label>Acréscimo Serviços (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={surchargeServices}
              onChange={(e) => setSurchargeServices(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {showSeparate ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="total">Desconto/Acréscimo Total</TabsTrigger>
            <TabsTrigger value="separate">Desconto/Acréscimo Separado</TabsTrigger>
          </TabsList>

          <TabsContent value="total">
            {renderTotalTabContent()}
          </TabsContent>
          
          <TabsContent value="separate">
            {renderSeparateTabContent()}
          </TabsContent>
        </Tabs>
      ) : (
        <div>
          {renderTotalTabContent()}
        </div>
      )}

      <div className="border rounded-md p-4 space-y-2 bg-muted/50">
        {hasProducts && (
          <div className="flex justify-between text-sm">
            <span>Subtotal Produtos:</span>
            <span className="font-mono">{formatCurrency(subtotalProducts)}</span>
          </div>
        )}
        
        {hasServices && (
          <div className="flex justify-between text-sm">
            <span>Subtotal Serviços:</span>
            <span className="font-mono">{formatCurrency(subtotalServices)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span className="font-mono">{formatCurrency(subtotalTotal)}</span>
        </div>

        {activeTab === "total" ? (
          <>
            <div className="flex justify-between text-sm text-red-600">
              <span>Desconto Total:</span>
              <span className="font-mono">-{formatCurrency(discTotalValue)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Acréscimo Total:</span>
              <span className="font-mono">+{formatCurrency(surTotalValue)}</span>
            </div>
          </>
        ) : (
          <>
            {hasProducts && (
              <>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto Produtos:</span>
                  <span className="font-mono">-{formatCurrency(discProductsValue)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Acréscimo Produtos:</span>
                  <span className="font-mono">+{formatCurrency(surProductsValue)}</span>
                </div>
              </>
            )}
            {hasServices && (
              <>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto Serviços:</span>
                  <span className="font-mono">-{formatCurrency(discServicesValue)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Acréscimo Serviços:</span>
                  <span className="font-mono">+{formatCurrency(surServicesValue)}</span>
                </div>
              </>
            )}
          </>
        )}
        
        <div className="flex justify-between font-medium border-t pt-2 mt-2">
          <span>Total:</span>
          <span className="font-mono">{formatCurrency(Math.max(0, finalTotal))}</span>
        </div>
      </div>
    </div>
  );
}
