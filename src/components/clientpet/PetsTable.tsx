// src/components/PetsTable.tsx
import React from "react";
import { Client, Pet } from "@/types/clients";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock } from "lucide-react";

interface PetRow {
  client: Client;
  pet: Pet;
}

interface Props {
  rows: PetRow[];
  onEdit: (clientId: string, pet: Pet) => void;
  onDelete: (pet: Pet) => void;
  onViewHistory: (pet: Pet) => void;
}

const PetsTable: React.FC<Props> = ({
  rows,
  onEdit,
  onDelete,
  onViewHistory,
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead>Tipo / Raça</TableHead>
        <TableHead>Idade</TableHead>
        <TableHead>Tutor</TableHead>
        <TableHead className="text-right">Ações</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(({ client, pet }) => (
        <TableRow key={pet.id}>
          <TableCell className="font-medium">{pet.name}</TableCell>
          <TableCell>
            {pet.type} / {pet.breed}
          </TableCell>
          <TableCell>
            {pet.age} {pet.age === 1 ? "ano" : "anos"}
          </TableCell>
          <TableCell>{client.name}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(client.id, pet)}
              >
                <Edit className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewHistory(pet)}
              >
                <Clock className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(pet)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default PetsTable;
