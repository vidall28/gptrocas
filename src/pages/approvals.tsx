
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Search, 
  X, 
  Package, 
  Check, 
  AlertCircle, 
  Calendar, 
  Download,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/lib/toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Navigate } from 'react-router-dom';

const Approvals: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { exchanges, products, updateExchange } = useData();
  
  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  // State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Review state
  const [selectedExchange, setSelectedExchange] = useState<typeof exchanges[0] | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Get pending exchanges
  const pendingExchanges = exchanges.filter(exchange => exchange.status === 'pending');
  
  // Apply filters and search
  const filteredExchanges = pendingExchanges.filter(exchange => {
    // Type filter
    if (typeFilter !== 'all' && exchange.type !== typeFilter) {
      return false;
    }
    
    // Date filter
    if (startDate && new Date(exchange.createdAt) < new Date(startDate)) {
      return false;
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      if (new Date(exchange.createdAt) > endDateTime) {
        return false;
      }
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      
      // Check label and user info
      if (
        exchange.label.toLowerCase().includes(searchLower) ||
        exchange.userName.toLowerCase().includes(searchLower) ||
        exchange.userRegistration.toLowerCase().includes(searchLower)
      ) {
        return true;
      }
      
      // Check items
      for (const item of exchange.items) {
        const product = products.find(p => p.id === item.productId);
        if (
          product?.name.toLowerCase().includes(searchLower) ||
          product?.code.toLowerCase().includes(searchLower) ||
          item.reason.toLowerCase().includes(searchLower)
        ) {
          return true;
        }
      }
      
      return false;
    }
    
    return true;
  });
  
  // Sort exchanges by date (newest first)
  const sortedExchanges = [...filteredExchanges].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Review exchange
  const reviewExchange = (exchange: typeof exchanges[0]) => {
    setSelectedExchange(exchange);
    setNotes('');
    setReviewOpen(true);
  };
  
  // Approve exchange
  const approveExchange = () => {
    if (!selectedExchange) return;
    
    updateExchange(selectedExchange.id, {
      status: 'approved',
      notes: notes || undefined,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name
    });
    
    setReviewOpen(false);
    toast.success('Registro aprovado com sucesso!');
  };
  
  // Reject exchange
  const rejectExchange = () => {
    if (!selectedExchange) return;
    
    if (!notes) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    
    updateExchange(selectedExchange.id, {
      status: 'rejected',
      notes,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name
    });
    
    setReviewOpen(false);
    toast.success('Registro rejeitado com sucesso!');
  };
  
  // Helper to get type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'exchange':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Troca</Badge>;
      case 'breakage':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Quebra</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: ptBR
    });
  };
  
  // Download single image
  const downloadImage = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Download all images as zip
  const downloadAllImages = async (exchange: typeof exchanges[0]) => {
    const zip = new JSZip();
    const images = zip.folder('images');
    
    // Add each image to the zip
    exchange.items.forEach((item, itemIndex) => {
      const product = products.find(p => p.id === item.productId);
      const productName = product ? product.name.replace(/\s+/g, '_') : 'unknown';
      
      item.photos.forEach((photo, photoIndex) => {
        // Convert base64 to blob
        const base64Data = photo.split(',')[1];
        const fileName = `${productName}_${product?.capacity || 0}ML_${item.quantity}UN_${itemIndex + 1}_${photoIndex + 1}.jpg`;
        
        images?.file(fileName, base64Data, { base64: true });
      });
    });
    
    // Generate zip
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `LogiSwap_${exchange.label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aprovações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as solicitações pendentes de trocas e quebras
        </p>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-4 w-4" /> Filtros e Busca
          </CardTitle>
          <CardDescription>
            Use os filtros para encontrar registros específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por legenda, usuário ou produto..."
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
            
            {/* Type Filter */}
            <div>
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="exchange">Trocas</SelectItem>
                  <SelectItem value="breakage">Quebras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Filters */}
            <div>
              <Input
                type="date"
                placeholder="Data Inicial"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Pending Approvals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4" /> Aprovações Pendentes ({sortedExchanges.length})
          </CardTitle>
          <CardDescription>
            Lista de registros pendentes de aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedExchanges.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum registro pendente de aprovação</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Todos os registros foram processados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Legenda</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedExchanges.map((exchange) => (
                    <TableRow key={exchange.id}>
                      <TableCell>
                        <div className="font-medium">{formatDate(exchange.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">{formatTimeAgo(exchange.createdAt)}</div>
                      </TableCell>
                      <TableCell>{exchange.label}</TableCell>
                      <TableCell>{getTypeBadge(exchange.type)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{exchange.userName}</div>
                        <div className="text-xs text-muted-foreground">{exchange.userRegistration}</div>
                      </TableCell>
                      <TableCell>{exchange.items.length} item(ns)</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reviewExchange(exchange)}
                          className="h-8"
                        >
                          Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Revisar Registro</DialogTitle>
            <DialogDescription>
              Analise os detalhes do registro para aprovar ou rejeitar
            </DialogDescription>
          </DialogHeader>
          
          {selectedExchange && (
            <ScrollArea className="max-h-[calc(80vh-120px)] pr-4">
              <div className="space-y-6 pt-4">
                {/* Header Info */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Legenda</p>
                    <p className="font-medium">{selectedExchange.label}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar size={14} /> {formatDate(selectedExchange.createdAt)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p>{getTypeBadge(selectedExchange.type)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Usuário</p>
                    <p className="font-medium">{selectedExchange.userName}</p>
                    <p className="text-xs text-muted-foreground">{selectedExchange.userRegistration}</p>
                  </div>
                  {selectedExchange.notes && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p>{selectedExchange.notes}</p>
                    </div>
                  )}
                </div>
                
                {/* Items */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Itens do Registro</h3>
                  
                  <div className="space-y-6">
                    {selectedExchange.items.map((item, index) => {
                      const product = products.find(p => p.id === item.productId);
                      
                      return (
                        <Card key={item.id} className="overflow-hidden">
                          <CardHeader className="bg-accent/50">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Package size={16} />
                              {product?.name || 'Produto não encontrado'}
                            </CardTitle>
                            <CardDescription>
                              {product?.code} - {product?.capacity}ml
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Quantidade</p>
                                    <p className="font-medium">{item.quantity} unidade(s)</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground">Motivo</p>
                                  <p>{item.reason}</p>
                                </div>
                                
                                {item.photos.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm text-muted-foreground">Fotos</p>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 gap-1"
                                        onClick={() => downloadAllImages(selectedExchange)}
                                      >
                                        <Download size={14} /> Baixar todas
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {item.photos.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                  {item.photos.map((photo, photoIndex) => (
                                    <div key={photoIndex} className="relative aspect-square rounded-md overflow-hidden border">
                                      <img
                                        src={photo}
                                        alt={`Foto ${photoIndex + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute bottom-1 right-1 bg-black/50 text-white hover:bg-black/70"
                                        onClick={() => {
                                          const product = products.find(p => p.id === item.productId);
                                          const fileName = `${product?.name.replace(/\s+/g, '_') || 'produto'}_${product?.capacity || 0}ML_${item.quantity}UN_${index + 1}_${photoIndex + 1}.jpg`;
                                          downloadImage(photo, fileName);
                                        }}
                                      >
                                        <Download size={14} />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
                
                {/* Decision Area */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Decisão</h3>
                  <Textarea
                    placeholder="Observações sobre a aprovação ou motivo da rejeição"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setReviewOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={rejectExchange}
              className="gap-1"
            >
              <AlertCircle size={16} /> Rejeitar
            </Button>
            <Button
              onClick={approveExchange}
              className="gap-1"
            >
              <Check size={16} /> Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approvals;
