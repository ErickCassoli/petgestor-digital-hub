
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Download, Filter, Loader2, Search } from "lucide-react";

interface SalesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPeriod: string;
  onPeriodChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  onExport: () => void;
  exportLoading: boolean;
  hasData: boolean;
  getPeriodLabel: () => string;
  getTypeLabel: () => string;
}

export function SalesFilters({
  searchTerm,
  onSearchChange,
  selectedPeriod,
  onPeriodChange,
  selectedType,
  onTypeChange,
  onExport,
  exportLoading,
  hasData,
  getPeriodLabel,
  getTypeLabel
}: SalesFiltersProps) {
  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar venda..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex-1 sm:flex-none justify-between">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{getPeriodLabel()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filtrar por período</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onPeriodChange("today")}>
              Hoje
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onPeriodChange("week")}>
              Esta semana
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onPeriodChange("month")}>
              Este mês
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onPeriodChange("lastMonth")}>
              Último mês
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex-1 sm:flex-none justify-between">
            <Filter className="h-4 w-4 mr-2" />
            <span>{getTypeLabel()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filtrar por tipo</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onTypeChange("all")}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onTypeChange("service")}>
              Serviços
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onTypeChange("product")}>
              Produtos
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onTypeChange("mixed")}>
              Mistos
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        onClick={onExport}
        disabled={exportLoading || !hasData}
        className="flex-1 sm:flex-none"
      >
        {exportLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Exportar
      </Button>
    </div>
  );
}
