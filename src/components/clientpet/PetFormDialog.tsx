// src/components/PetFormDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pet, Client } from "@/types/clients";

interface Props {
  open: boolean;
  pet?: Pet | null;
  client: Client | null;
  onClose: () => void;
  onSave: (data: Omit<Pet, "id" | "client_id" | "user_id">) => void;
}

const PetFormDialog: React.FC<Props> = ({
  open,
  pet,
  client,
  onClose,
  onSave,
}) => {

  const [form, setForm] = useState<Omit<Pet, "id" | "client_id" | "user_id">>({
    name: "",
    type: "",
    breed: "",
    age: null,
  });

  useEffect(() => {
    if (pet) {
      setForm({
        name: pet.name,
        type: pet.type,
        breed: pet.breed || "",
        age: pet.age,
      });
    } else {
      setForm({ name: "", type: "", breed: "", age: null });
    }
  }, [pet, open]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm({
      ...form,
      [field]:
        field === "age"
          ? value === ""
            ? null
            : parseInt(value)
          : value,
    });
  };

  const handleSubmit = () => {
    if (!form.name || !form.type) return;
    onSave(form);
  };

  if (!open || !client) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{pet ? "Editar Pet" : `Novo Pet: ${client.name}`}</DialogTitle>
          <DialogDescription>Preencha os dados do pet.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pet-name">Nome *</Label>
            <Input
              id="pet-name"
              placeholder="Nome do pet"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pet-type">Tipo *</Label>
            <Input
              id="pet-type"
              placeholder="Cachorro, Gato"
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pet-breed">Raça</Label>
            <Input
              id="pet-breed"
              placeholder="Raça do pet"
              value={form.breed}
              onChange={(e) => handleChange("breed", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pet-age">Idade (anos)</Label>
            <Input
              id="pet-age"
              type="number"
              min={0}
              placeholder="Idade em anos"
              value={form.age != null ? form.age.toString() : ""}
              onChange={(e) => handleChange("age", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PetFormDialog;
