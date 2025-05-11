import { useState, useEffect } from "react";
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
  AlertTriangle,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: number;
  stock: number;
  min_stock: number | null;
  type: number; // 1 = unidade, 2 = peso (kg)
}

const Products = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [productFormData, setProductFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    stock: "",
    minStock: "",
    type: "1" // default para unidade
  });

  // Busca produtos do Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        setProducts(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            price: p.price,
            stock: p.stock,
            min_stock: p.min_stock,
            type: p.type
          }))
        );
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Erro ao carregar produtos",
          description: "Ocorreu um erro ao buscar os produtos."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, toast]);

  // Filtra por nome ou categoria
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Define status de estoque
  const getStockStatus = (stock: number, min: number | null) => {
    const threshold = min ?? 5;
    if (stock <= 0) {
      return { label: "Sem estoque", color: "bg-red-500" };
    }
    if (stock < threshold) {
      return { label: "Estoque baixo", color: "bg-amber-500" };
    }
    return { label: "Em estoque", color: "bg-green-500" };
  };

  const lowStockProducts = products.filter(
    (p) => p.stock <= 0 || p.stock < (p.min_stock ?? 5)
  );

  // Abre diálogo de adicionar/editar
  const openProductDialog = (product: Product | null = null) => {
    setSelectedProduct(product);

    if (product) {
      setProductFormData({
        name: product.name,
        category: product.category ?? "",
        description: product.description ?? "",
        price: product.price.toString(),
        stock: product.stock.toString(),
        minStock: product.min_stock?.toString() ?? "5",
        type: product.type.toString()
      });
    } else {
      setProductFormData({
        name: "",
        category: "",
        description: "",
        price: "",
        stock: "0",
        minStock: "5",
        type: "1"
      });
    }

    setIsProductDialogOpen(true);
  };

  // Abre diálogo de exclusão
  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Salvar ou atualizar produto
  const handleProductSubmit = async () => {
    if (!user) return;

    const {
      name,
      category,
      description,
      price: priceStr,
      stock: stockStr,
      minStock: minStockStr,
      type: typeStr
    } = productFormData;

    if (!name || !priceStr) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e preço."
      });
      return;
    }

    const price = parseFloat(priceStr);
    const stock = parseInt(stockStr);
    const min_stock = parseInt(minStockStr);
    const type = parseInt(typeStr);

    if (isNaN(price) || price < 0) {
      toast({
        variant: "destructive",
        title: "Preço inválido",
        description: "Informe um preço válido."
      });
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast({
        variant: "destructive",
        title: "Estoque inválido",
        description: "Informe um estoque válido."
      });
      return;
    }
    if (isNaN(min_stock) || min_stock < 0) {
      toast({
        variant: "destructive",
        title: "Estoque mínimo inválido",
        description: "Informe um estoque mínimo válido."
      });
      return;
    }
    if (![1, 2].includes(type)) {
      toast({
        variant: "destructive",
        title: "Tipo inválido",
        description: "Selecione Unidade ou Peso."
      });
      return;
    }

    try {
      if (selectedProduct) {
        // UPDATE
        const { error } = await supabase
          .from("products")
          .update({
            name,
            category: category || null,
            description: description || null,
            price,
            stock,
            min_stock,
            type,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedProduct.id);

        if (error) throw error;

        setProducts((old) =>
          old.map((p) =>
            p.id === selectedProduct.id
              ? { ...p, name, category, description, price, stock, min_stock, type }
              : p
          )
        );
        toast({ title: "Produto atualizado", description: `${name} atualizado.` });
      } else {
        // INSERT
        const { data, error } = await supabase
          .from("products")
          .insert({
            user_id: user.id,
            name,
            category: category || null,
            description: description || null,
            price,
            stock,
            min_stock,
            type
          })
          .select();

        if (error) throw error;
        if (data && data.length) {
          setProducts((old) => [
            ...old,
            {
              ...data[0],
              category: data[0].category,
              description: data[0].description
            }
          ]);
        }
        toast({ title: "Produto adicionado", description: `${name} adicionado.` });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o produto."
      });
    } finally {
      setIsProductDialogOpen(false);
    }
  };

  // Excluir produto
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", selectedProduct.id);
      if (error) throw error;
      setProducts((old) => old.filter((p) => p.id !== selectedProduct.id));
      toast({ title: "Produto removido", description: `${selectedProduct.name} removido.` });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Ocorreu um erro ao remover o produto."
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-petblue-600" />
        <span className="ml-2 text-lg text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos e Estoque</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os produtos e controle o estoque do seu petshop
          </p>
        </div>
        <Button
          className="mt-4 sm:mt-0 bg-petblue-600 hover:bg-petblue-700"
          onClick={() => openProductDialog()}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Produto
        </Button>
      </div>

      {/* Aviso de estoque baixo */}
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
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((p) => {
                  const status = getStockStatus(p.stock, p.min_stock);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell className="text-center">
                        {p.stock} {p.type === 2 ? "kg" : "und"}
                      </TableCell>
                      <TableCell className="text-center">{p.min_stock ?? 5}</TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      <Card className="mb-4">
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

      {/* Lista de Produtos */}
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
                {filteredProducts.map((p) => {
                  const status = getStockStatus(p.stock, p.min_stock);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell className="text-right">
                        {p.price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.stock} {p.type === 2 ? "kg" : "und"}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openProductDialog(p)}
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(p)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo adicionar/editar */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do produto. Campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Nome do produto"
                value={productFormData.name}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                placeholder="Categoria do produto"
                value={productFormData.category}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, category: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Descrição do produto"
                value={productFormData.description}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, description: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Preço *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={productFormData.price}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, price: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={productFormData.stock}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, stock: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minStock">Estoque Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={productFormData.minStock}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, minStock: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tipo *</Label>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name="type"
                    value="1"
                    checked={productFormData.type === "1"}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, type: e.target.value })
                    }
                  />
                  <span>Unidade</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name="type"
                    value="2"
                    checked={productFormData.type === "2"}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, type: e.target.value })
                    }
                  />
                  <span>Peso (kg)</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleProductSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold">{selectedProduct?.name}</span>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
