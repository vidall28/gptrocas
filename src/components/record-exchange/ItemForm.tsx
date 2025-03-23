
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Product } from '@/context/DataContext';
import { Plus } from 'lucide-react';
import ProductSelector from './ProductSelector';
import PhotoUploader from './PhotoUploader';

interface ItemFormProps {
  products: Product[];
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  quantity: string;
  setQuantity: (quantity: string) => void;
  reason: string;
  setReason: (reason: string) => void;
  photos: string[];
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  addItem: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({
  products,
  selectedProductId,
  setSelectedProductId,
  quantity,
  setQuantity,
  reason,
  setReason,
  photos,
  setPhotos,
  handleFileChange,
  removePhoto,
  addItem
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Adicionar Item</h3>
      
      <ProductSelector
        products={products}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
      />
      
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
      
      <PhotoUploader
        photos={photos}
        setPhotos={setPhotos}
        handleFileChange={handleFileChange}
        removePhoto={removePhoto}
      />
      
      <Button 
        type="button" 
        className="w-full" 
        onClick={addItem}
        disabled={!selectedProductId || !reason || photos.length === 0}
      >
        <Plus size={16} className="mr-1" /> Adicionar Item
      </Button>
    </div>
  );
};

export default ItemForm;
