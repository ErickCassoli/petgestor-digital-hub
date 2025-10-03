import React, { useState, useEffect } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";
import type { AppDatabase } from "@/types/supabase-extensions";
import { Button } from "@/components/ui/button";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InvoiceFormProps {
  open: boolean;
  appointment: {
    id: string;
    pet: { id: string; name: string };
    service: { id: string; name: string };
  };
  supabase: SupabaseClient<AppDatabase>;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

type ServiceOption = Pick<Tables<'services'>, 'id' | 'name' | 'price'>;
interface LineItem {
  serviceId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export default function InvoiceForm({
  open,
  appointment,
  supabase,
  user,
  onClose,
  onSuccess,
}: InvoiceFormProps) {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [surcharge, setSurcharge] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // carregar serviços e inicializar item do agendamento
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data: svs, error: srvErr } = await supabase
          .from("services")
          .select("id,name,price")
          .eq("user_id", user.id)
          .order("name");
        if (srvErr) throw srvErr;
        setServices(svs || []);
        const original = svs?.find((s) => s.id === appointment.service.id);
        if (original) {
          setItems([
            {
              serviceId: original.id,
              quantity: 1,
              unitPrice: original.price,
              subtotal: original.price,
            },
          ]);
        } else {
          setItems([]);
        }
      } catch (error: unknown) {
        const description = error instanceof Error ? error.message : "Erro desconhecido ao carregar serviços.";
        toast({
          variant: "destructive",
          title: "Erro ao carregar serviços",
          description,
        });
      }
    })();
  }, [open, supabase, user.id, appointment.service.id, toast]);

  const addLine = () => {
    if (services.length === 0) return;
    const first = services[0];
    setItems([
      ...items,
      {
        serviceId: first.id,
        quantity: 1,
        unitPrice: first.price,
        subtotal: first.price,
      },
    ]);
  };

  const updateLine = (idx: number, serviceId: string, quantity: number) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    const updated = [...items];
    const unitPrice = svc.price;
    updated[idx] = {
      serviceId,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
    };
    setItems(updated);
  };

  const removeLine = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const total = subtotal - discount + surcharge;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // 1) cria invoice
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert([
          {
            appointment_id: appointment.id,
            user_id: user.id,
            pet_id: appointment.pet.id,
            discount_amount: discount,
            surcharge_amount: surcharge,
            final_amount: total,
          },
        ])
        .select("id")
        .single();
      if (invErr) throw invErr;
      // 2) itens
      const payload = items.map((i) => ({
        invoice_id: inv.id,
        service_id: i.serviceId,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        subtotal: i.subtotal,
      }));
      const { error: itemsErr } = await supabase
        .from("invoice_items")
        .insert(payload);
      if (itemsErr) throw itemsErr;
      // 3) atualiza agendamento
      const { error: apptErr } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointment.id);
      if (apptErr) throw apptErr;

      toast({ title: "Fatura gerada com sucesso!" });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : "Falha ao gerar a fatura.";
      toast({
        variant: "destructive",
        title: "Erro ao gerar fatura",
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-rose-500"
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">Nova Fatura</h2>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr>
              <th className="text-left">Serviço</th>
              <th className="text-center">Qtde</th>
              <th className="text-right">Unit.</th>
              <th className="text-right">Subtotal</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((line, idx) => (
              <tr key={idx} className="border-t">
                <td>
                  <select
                    className="input w-full"
                    value={line.serviceId}
                    onChange={(e) =>
                      updateLine(idx, e.target.value, line.quantity)
                    }
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="text-center">
                  <input
                    type="number"
                    className="input w-16"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(idx, line.serviceId, +e.target.value)
                    }
                  />
                </td>
                <td className="text-right">{line.unitPrice.toFixed(2)}</td>
                <td className="text-right">{line.subtotal.toFixed(2)}</td>
                <td className="text-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeLine(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between mb-4">
          <Button
            size="icon"
            variant="outline"
            onClick={addLine}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Subtotal: R$ {subtotal.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm">Desconto (R$)</label>
            <input
              type="number"
              className="input w-full"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(+e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm">Acréscimo (R$)</label>
            <input
              type="number"
              className="input w-full"
              min={0}
              value={surcharge}
              onChange={(e) => setSurcharge(+e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-lg font-bold">R$ {total.toFixed(2)}</span>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-petblue-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Gerando..." : "Confirmar e Gerar"}
          </Button>
        </div>
      </div>
    </div>
  );
}




