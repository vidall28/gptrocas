
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Product } from '@/context/DataContext';

interface ProductSelectorProps {
  products: Product[];
  selectedProductId: string;
  setSelectedProductId: (value: string) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ 
  products, 
  selectedProductId, 
  setSelectedProductId 
}) => {
  return (
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
  );
};

export default ProductSelector;
