import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash, Box, Search, X } from 'lucide-react';
import { toast } from '@/lib/toast';

const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const [search, setSearch] = useState('');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.code.toLowerCase().includes(search.toLowerCase())
  );
  
  const resetForm = () => {
    setName('');
    setCode('');
    setCapacity('');
    setEditingProductId(null);
  };
  
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !code || !capacity) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    const capacityValue = parseInt(capacity);
    if (isNaN(capacityValue) || capacityValue <= 0) {
      toast.error('Capacidade inválida');
      return;
    }
    
    if (products.some(p => p.code === code)) {
      toast.error('Já existe um produto com este código');
      return;
    }
    
    addProduct({
      name,
      code,
      capacity: capacityValue
    });
    
    resetForm();
    setIsAddDialogOpen(false);
  };
  
  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProductId || !name || !code || !capacity) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    const capacityValue = parseInt(capacity);
    if (isNaN(capacityValue) || capacityValue <= 0) {
      toast.error('Capacidade inválida');
      return;
    }
    
    if (products.some(p => p.code === code && p.id !== editingProductId)) {
      toast.error('Já existe um produto com este código');
      return;
    }
    
    updateProduct(editingProductId, {
      name,
      code,
      capacity: capacityValue
    });
    
    resetForm();
    setIsEditDialogOpen(false);
  };
  
  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
    }
  };
  
  const startEditingProduct = (product: typeof products[0]) => {
    setEditingProductId(product.id);
    setName(product.name);
    setCode(product.code);
    setCapacity(product.capacity.toString());
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento de produtos do sistema
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus size={16} /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do produto"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Código
                </label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Código do produto"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="capacity" className="text-sm font-medium">
                  Capacidade (ml)
                </label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Capacidade em ml"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit">Adicionar Produto</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Lista de Produtos</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} produtos cadastrados no sistema
          </p>
        </div>
        
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Box className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Nenhum produto cadastrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Novo Produto" para adicionar o primeiro produto.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tente usar termos diferentes na busca.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Capacidade (ml)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.capacity} ml</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => startEditingProduct(product)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Excluir"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProduct} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do produto"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-code" className="text-sm font-medium">
                Código
              </label>
              <Input
                id="edit-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Código do produto"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-capacity" className="text-sm font-medium">
                Capacidade (ml)
              </label>
              <Input
                id="edit-capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Capacidade em ml"
                min="1"
                required
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
