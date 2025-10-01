// src/components/PetHistoryDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Appointment } from "@/types/clients";

interface Props {
  open: boolean;
  petName: string;
  history: Appointment[];
  onClose: () => void;
}

const PetHistoryDialog: React.FC<Props> = ({
  open,
  petName,
  history,
  onClose,
}) => {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de {petName}</DialogTitle>
          <DialogDescription>
            Veja todos os agendamentos concluídos, serviços e observações.
          </DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((appt) => (
              <TableRow key={appt.id}>
                <TableCell>
                  {new Date(appt.date).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell>{appt.service || "-"}</TableCell>
                <TableCell className="capitalize">
                  {appt.status.replace(/_/g, " ")}
                </TableCell>
                <TableCell>{appt.notes || "-"}</TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                  Nenhum agendamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PetHistoryDialog;
