
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Calendar, Check, ChevronDown, FileSpreadsheet, Loader2, Search } from "lucide-react";

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
  const periodOptions = [
    { label: "Hoje", value: "today" },
    { label: "Esta semana", value: "week" },
    { label: "Este mês", value: "month" },
    { label: "Último mês", value: "lastMonth" }
  ];

  const typeOptions = [
    { label: "Todos", value: "all" },
    { label: "Serviços", value: "service" },
    { label: "Produtos", value: "product" }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative w-full sm:w-auto max-w-xs">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex justify-between">
            <Calendar className="h-4 w-4 mr-2" />
            {getPeriodLabel()}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {periodOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onPeriodChange(option.value)}
              className="flex items-center justify-between"
            >
              {option.label}
              {selectedPeriod === option.value && (
                <Check className="h-4 w-4 ml-2" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex justify-between">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {getTypeLabel()}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {typeOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onTypeChange(option.value)}
              className="flex items-center justify-between"
            >
              {option.label}
              {selectedType === option.value && (
                <Check className="h-4 w-4 ml-2" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        variant="outline"
        className="flex items-center"
        onClick={onExport}
        disabled={exportLoading || !hasData}
      >
        {exportLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 mr-2" />
        )}
        Exportar
      </Button>
    </div>
  );
}
