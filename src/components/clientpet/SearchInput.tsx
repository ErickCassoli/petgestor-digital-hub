// src/components/SearchInput.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const SearchInput: React.FC<Props> = ({ value, onChange, placeholder }) => (
  <div className="relative mb-6">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <Input
      placeholder={placeholder || "Buscar..."}
      className="pl-10"
      value={value}
      onChange={onChange}
    />
  </div>
);

export default SearchInput;
