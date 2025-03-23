
import React from 'react';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface RecordFormProps {
  label: string;
  setLabel: (label: string) => void;
  type: 'exchange' | 'breakage';
  setType: (type: 'exchange' | 'breakage') => void;
}

const RecordForm: React.FC<RecordFormProps> = ({ 
  label, 
  setLabel, 
  type, 
  setType 
}) => {
  return (
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
  );
};

export default RecordForm;
