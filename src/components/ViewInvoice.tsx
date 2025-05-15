import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { format } from "date-fns";

interface ViewInvoiceProps {
  open: boolean;
  invoice:
    | {
        id: string;
        discount_amount: number;
        surcharge_amount: number;
        final_amount: number;
        created_at: string;
        invoice_items: Array<{
          id: string;
          service_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          services: { name: string };
        }>;
      }
    | null;
  onClose: () => void;
}

export default function ViewInvoice({
  open,
  invoice,
  onClose,
}: ViewInvoiceProps) {
  if (!open || !invoice) return null;
  const subtotal = invoice.invoice_items.reduce(
    (sum, i) => sum + i.subtotal,
    0
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-rose-500"
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold mb-2">Fatura</h2>
        <p className="text-sm text-gray-600 mb-4">
          Emitida em{" "}
          {format(new Date(invoice.created_at), "dd/MM/yyyy 'às' HH:mm")}
        </p>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr>
              <th className="text-left">Serviço</th>
              <th className="text-center">Qtd</th>
              <th className="text-right">Unit.</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items.map((item) => (
              <tr key={item.id} className="border-t">
                <td>{item.services.name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{item.unit_price.toFixed(2)}</td>
                <td className="text-right">{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Desconto:</span>
            <span>- R$ {invoice.discount_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Acréscimo:</span>
            <span>+ R$ {invoice.surcharge_amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-lg font-bold">
            R$ {invoice.final_amount.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
