
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, ArrowDown, Loader2 } from "lucide-react";

interface SalesFiltersProps {
  searchTerm: string;
  selectedPeriod: string;
  selectedType: string;
  onSearchChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onExport: () => void;
  exportLoading: boolean;
  hasData: boolean;
  getPeriodLabel: () => string;
  getTypeLabel: () => string;
}

export function SalesFilters({
  searchTerm,
  selectedPeriod,
  selectedType,
  onSearchChange,
  onPeriodChange,
  onTypeChange,
  onExport,
  exportLoading,
  hasData,
  getPeriodLabel,
  getTypeLabel,
}: SalesFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Pesquisar..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex-shrink-0">
            <Filter className="h-4 w-4 mr-1" />
            {getPeriodLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onPeriodChange("today")}>
            Hoje
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPeriodChange("week")}>
            Esta semana
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPeriodChange("month")}>
            Este mês
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPeriodChange("lastMonth")}>
            Último mês
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex-shrink-0">
            <Filter className="h-4 w-4 mr-1" />
            {getTypeLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onTypeChange("all")}>
            Todos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTypeChange("service")}>
            Serviços
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTypeChange("product")}>
            Produtos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTypeChange("mixed")}>
            Mistos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button 
        variant="outline" 
        className="flex-shrink-0" 
        onClick={onExport}
        disabled={exportLoading || !hasData}
      >
        {exportLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ArrowDown className="h-4 w-4 mr-1" />
        )}
        Exportar
      </Button>
    </div>
  );
}
