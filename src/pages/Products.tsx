
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
  category?: string;
  description?: string | null;
  price: number;
  stock: number;
  min_stock: number | null;
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
    minStock: ""
  });

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setProducts(data.map(product => ({
          ...product,
          category: product.description || 'Não categorizado' // Using description for category
        })));
      } catch (error) {
        console.error('Error fetching products:', error);
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

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate stock status
  const getStockStatus = (stock: number, minStock: number | null) => {
    const effectiveMinStock = minStock || 5; // Default to 5 if min_stock is null
    
    if (stock <= 0) {
      return { status: "outOfStock", label: "Sem estoque", color: "bg-red-500" };
    } else if (stock < effectiveMinStock) {
      return { status: "lowStock", label: "Estoque baixo", color: "bg-amber-500" };
    } else {
      return { status: "inStock", label: "Em estoque", color: "bg-green-500" };
    }
  };

  // Get products with low or out of stock
  const lowStockProducts = products.filter(
    (product) => product.stock <= 0 || 
    (product.stock < (product.min_stock || 5))
  );

  // Open product dialog for adding or editing
  const openProductDialog = (product: Product | null = null) => {
    setSelectedProduct(product);
    
    if (product) {
      setProductFormData({
        name: product.name,
        category: product.category || '',
        description: product.description || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        minStock: product.min_stock?.toString() || '5'
      });
    } else {
      setProductFormData({
        name: "",
        category: "",
        description: "",
        price: "",
        stock: "0",
        minStock: "5"
      });
    }
    
    setIsProductDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Handle product form submission
  const handleProductSubmit = async () => {
    if (!user) return;
    
    if (!productFormData.name || !productFormData.price) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e preço do produto."
      });
      return;
    }
    
    const price = parseFloat(productFormData.price);
    const stock = parseInt(productFormData.stock || '0');
    const minStock = parseInt(productFormData.minStock || '5');
    
    if (isNaN(price) || price < 0) {
      toast({
        variant: "destructive",
        title: "Preço inválido",
        description: "Por favor, informe um preço válido."
      });
      return;
    }
    
    if (isNaN(stock) || stock < 0) {
      toast({
        variant: "destructive",
        title: "Estoque inválido",
        description: "Por favor, informe um valor de estoque válido."
      });
      return;
    }
    
    if (isNaN(minStock) || minStock < 0) {
      toast({
        variant: "destructive",
        title: "Estoque mínimo inválido",
        description: "Por favor, informe um valor de estoque mínimo válido."
      });
      return;
    }
    
    try {
      if (selectedProduct) {
        // Edit existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: productFormData.name,
            description: productFormData.description || null,
            price: price,
            stock: stock,
            min_stock: minStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedProduct.id);
        
        if (error) throw error;
        
        // Update local state
        setProducts(products.map(product =>
          product.id === selectedProduct.id
            ? {
                ...product,
                name: productFormData.name,
                category: productFormData.category,
                description: productFormData.description || null,
                price: price,
                stock: stock,
                min_stock: minStock
              }
            : product
        ));
        
        toast({
          title: "Produto atualizado",
          description: `${productFormData.name} foi atualizado com sucesso.`
        });
      } else {
        // Add new product
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: productFormData.name,
            description: productFormData.description || null,
            price: price,
            stock: stock,
            min_stock: minStock,
            user_id: user.id
          })
          .select();
        
        if (error) throw error;
        
        // Update local state
        if (data && data.length > 0) {
          const newProduct = {
            ...data[0],
            category: productFormData.category || 'Não categorizado'
          };
          setProducts([...products, newProduct]);
        }
        
        toast({
          title: "Produto adicionado",
          description: `${productFormData.name} foi adicionado com sucesso.`
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o produto."
      });
    } finally {
      setIsProductDialogOpen(false);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);
      
      if (error) throw error;
      
      // Update local state
      setProducts(products.filter(product => product.id !== selectedProduct.id));
      
      toast({
        title: "Produto removido",
        description: `${selectedProduct.name} foi removido com sucesso.`
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Ocorreu um erro ao remover o produto."
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // JSX for the loading state
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos e Estoque</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os produtos e controle o estoque do seu petshop
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            className="bg-petblue-600 hover:bg-petblue-700"
            onClick={() => openProductDialog()}
          >
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
                  const stockStatus = getStockStatus(product.stock, product.min_stock);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-center">{product.stock}</TableCell>
                      <TableCell className="text-center">{product.min_stock || 5}</TableCell>
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
                  const stockStatus = getStockStatus(product.stock, product.min_stock);
                  
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
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openProductDialog(product)}
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(product)}
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

      {/* Product Dialog */}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleProductSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir o produto{" "}
              <span className="font-semibold">{selectedProduct?.name}</span>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
