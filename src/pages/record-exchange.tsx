
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { Camera, Package, Trash, Info, Plus, Check } from 'lucide-react';

const RecordExchange: React.FC = () => {
  const { user } = useAuth();
  const { products, addExchange } = useData();
  
  // Form state
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'exchange' | 'breakage'>('breakage');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [items, setItems] = useState<Array<{
    id: string;
    productId: string;
    quantity: number;
    reason: string;
    photos: string[];
  }>>([]);
  
  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get selected product
  const selectedProduct = products.find(p => p.id === selectedProductId);
  
  // Reset item form
  const resetItemForm = () => {
    setSelectedProductId('');
    setQuantity('1');
    setReason('');
    setPhotos([]);
  };
  
  // Handle image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Convert files to base64
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        toast.error(`A imagem ${file.name} é muito grande (máx. 5MB)`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotos(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  
  // Add item to list
  const addItem = () => {
    if (!selectedProductId) {
      toast.error('Selecione um produto');
      return;
    }
    
    if (isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      toast.error('Quantidade inválida');
      return;
    }
    
    if (!reason) {
      toast.error('Informe o motivo');
      return;
    }
    
    if (photos.length === 0) {
      toast.error('Adicione pelo menos uma foto');
      return;
    }
    
    const newItem = {
      id: Date.now().toString(),
      productId: selectedProductId,
      quantity: parseInt(quantity),
      reason,
      photos
    };
    
    setItems([...items, newItem]);
    resetItemForm();
    toast.success('Item adicionado à lista');
  };
  
  // Remove item from list
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast.success('Item removido da lista');
  };
  
  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!label) {
      toast.error('Informe uma legenda para o registro');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }
    
    // Create exchange
    addExchange({
      userId: user!.id,
      userName: user!.name,
      userRegistration: user!.registration,
      label,
      type,
      items,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    // Reset form
    setLabel('');
    setType('breakage');
    setItems([]);
    resetItemForm();
    
    toast.success('Registro enviado com sucesso!');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registrar Troca/Quebra</h1>
        <p className="text-muted-foreground mt-1">
          Registre trocas ou quebras de produtos
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* New Record Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> 
                Novo Registro
              </CardTitle>
              <CardDescription>
                Registro #{items.length > 0 ? label || 'Sem legenda' : 'Novo'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5">
                {/* Legenda e Data */}
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="label" className="text-sm font-medium">
                      Legenda
                    </label>
                    <Input
                      id="label"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Registro #1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="date" className="text-sm font-medium">
                      Data
                    </label>
                    <Input
                      id="date"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      disabled
                    />
                  </div>
                </div>
                
                {/* Tipo */}
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Tipo
                  </label>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value as 'exchange' | 'breakage')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakage">Quebra</SelectItem>
                      <SelectItem value="exchange">Troca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Observações Gerais */}
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Observações Gerais
                  </label>
                  <Textarea
                    id="notes"
                    placeholder="Observações gerais sobre este grupo de itens"
                    rows={3}
                  />
                </div>
              </form>
              
              <hr className="my-6" />
              
              {/* Item Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Adicionar Item</h3>
                
                {/* Produto */}
                <div className="space-y-2">
                  <label htmlFor="product" className="text-sm font-medium">
                    Produto
                  </label>
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Busque pelo nome do produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nenhum produto cadastrado
                        </SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.code}) - {product.capacity}ml
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Quantidade */}
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Quantidade
                  </label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                
                {/* Motivo */}
                <div className="space-y-2">
                  <label htmlFor="reason" className="text-sm font-medium">
                    Motivo
                  </label>
                  <Textarea
                    id="reason"
                    placeholder="Descreva o motivo da quebra ou troca"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>
                
                {/* Fotos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Fotos
                  </label>
                  <div className="border rounded-md p-4">
                    {photos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {photos.map((photo, index) => (
                          <div 
                            key={index} 
                            className="relative aspect-square rounded-md overflow-hidden border"
                          >
                            <img 
                              src={photo} 
                              alt={`Foto ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1"
                              aria-label="Remover foto"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        ))}
                        <label
                          htmlFor="photo-upload"
                          className="flex items-center justify-center aspect-square rounded-md border border-dashed cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                          <Camera className="h-8 w-8 text-muted-foreground" />
                          <input
                            id="photo-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    ) : (
                      <label
                        htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center p-6 border-dashed border-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          Clique para selecionar fotos
                        </p>
                        <input
                          id="photo-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  className="w-full" 
                  onClick={addItem}
                  disabled={!selectedProductId || !reason || photos.length === 0}
                >
                  <Plus size={16} className="mr-1" /> Adicionar Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Items Added */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> 
                Itens Adicionados
              </CardTitle>
              <CardDescription>
                Lista de itens do registro atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Fotos</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="font-medium">{product?.name || 'Produto não encontrado'}</div>
                                <div className="text-sm text-muted-foreground">{product?.code}</div>
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.photos.length} foto(s)</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.id)}
                                  className="text-destructive"
                                >
                                  <Trash size={16} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {items.length} {items.length === 1 ? 'item adicionado' : 'itens adicionados'}
                    </div>
                    <Button onClick={handleSubmit}>
                      <Check size={16} className="mr-1" /> Finalizar Registro
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Info className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Nenhum item adicionado ainda</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    Preencha os dados do item no formulário ao lado e clique em "Adicionar Item" para incluí-lo na lista.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Instructions Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> 
                Instruções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc pl-5">
                <li>Preencha os dados do registro (legenda, tipo, observações)</li>
                <li>Adicione os produtos afetados um a um com as respectivas quantidades</li>
                <li>Inclua fotos para documentar cada item (quando necessário)</li>
                <li>Após adicionar todos os itens, clique em "Finalizar Registro"</li>
                <li>O registro será enviado com status "Pendente" para aprovação</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecordExchange;
