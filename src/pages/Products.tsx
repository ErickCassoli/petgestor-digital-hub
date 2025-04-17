
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Package, 
  AlertTriangle 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Mock data for products
const MOCK_PRODUCTS = [
  { 
    id: "1", 
    name: "Ração Premium Cães Adultos", 
    category: "Ração",
    price: 89.90,
    stock: 8,
    minStock: 5
  },
  { 
    id: "2", 
    name: "Ração Gatos Castrados", 
    category: "Ração",
    price: 79.90,
    stock: 12,
    minStock: 5
  },
  { 
    id: "3", 
    name: "Shampoo Neutro", 
    category: "Higiene",
    price: 29.90,
    stock: 3,
    minStock: 5
  },
  { 
    id: "4", 
    name: "Antipulgas Comprimido", 
    category: "Medicamento",
    price: 45.90,
    stock: 4,
    minStock: 10
  },
  { 
    id: "5", 
    name: "Coleira Ajustável G", 
    category: "Acessório",
    price: 35.90,
    stock: 15,
    minStock: 3
  },
  { 
    id: "6", 
    name: "Brinquedo Interativo", 
    category: "Brinquedo",
    price: 25.90,
    stock: 20,
    minStock: 5
  },
  { 
    id: "7", 
    name: "Escova de Pelos", 
    category: "Higiene",
    price: 19.90,
    stock: 2,
    minStock: 3
  },
  { 
    id: "8", 
    name: "Areia Sanitária", 
    category: "Higiene",
    price: 15.90,
    stock: 25,
    minStock: 10
  }
];

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
}

const Products = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stock status
  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) {
      return { status: "outOfStock", label: "Sem estoque", color: "bg-red-500" };
    } else if (stock < minStock) {
      return { status: "lowStock", label: "Estoque baixo", color: "bg-amber-500" };
    } else {
      return { status: "inStock", label: "Em estoque", color: "bg-green-500" };
    }
  };

  // Get products with low or out of stock
  const lowStockProducts = products.filter(
    (product) => product.stock <= 0 || product.stock < product.minStock
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos e Estoque</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os produtos e controle o estoque do seu petshop
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button className="bg-petblue-600 hover:bg-petblue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="mb-8 border-amber-200">
          <CardHeader className="bg-amber-50 pb-3">
            <CardTitle className="flex items-center text-amber-800">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-center">{product.stock}</TableCell>
                      <TableCell className="text-center">{product.minStock}</TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Buscar Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Busque por nome, categoria..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-2 text-gray-500 font-medium">Nenhum produto encontrado</p>
              <p className="text-gray-400">Adicione novos produtos ou ajuste sua busca</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">
                        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.stock} und
                      </TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
