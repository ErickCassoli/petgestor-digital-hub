// src/components/ClientsTable.tsx
import React from "react";
import { Client } from "@/types/clients";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Dog, Trash2, Phone, Mail } from "lucide-react";

interface Props {
  clients: Client[];
  onEdit: (client: Client) => void;
  onAddPet: (clientId: string) => void;
  onDelete: (client: Client) => void;
}

const ClientsTable: React.FC<Props> = ({
  clients,
  onEdit,
  onAddPet,
  onDelete,
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead>Contato</TableHead>
        <TableHead>Pets</TableHead>
        <TableHead className="text-right">Ações</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {clients.map((client) => (
        <TableRow key={client.id}>
          <TableCell className="font-medium">{client.name}</TableCell>
          <TableCell>
            <div className="flex flex-col text-sm text-gray-600">
              {client.phone && (
                <span>
                  <Phone className="h-3 w-3 mr-1 inline" />
                  {client.phone}
                </span>
              )}
              {client.email && (
                <span>
                  <Mail className="h-3 w-3 mr-1 inline" />
                  {client.email}
                </span>
              )}
            </div>
          </TableCell>
          <TableCell>
            {client.pets.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {client.pets.map((pet) => (
                  <span
                    key={pet.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-petblue-100 text-petblue-800"
                  >
                    <Dog className="h-3 w-3 mr-1" />
                    {pet.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">Nenhum pet</span>
            )}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit(client)}>
                <Edit className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAddPet(client.id)}
              >
                <Dog className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(client)}
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

export default ClientsTable;
