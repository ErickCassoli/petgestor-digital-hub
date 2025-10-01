// src/types/index.ts
export interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age: number | null;
  client_id: string;
  user_id?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  user_id?: string;
  pets: Pet[];
}

export interface Appointment {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  pet_id: string;
  service: string | null;
}
