
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface DatePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  disabled?: boolean;
  allowFutureDates?: boolean;
  label?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  date,
  setDate,
  disabled = false,
  allowFutureDates = false,
  label = 'Data',
}) => {
  const [inputValue, setInputValue] = useState<string>(format(date, 'dd/MM/yyyy'));
  const [isOpen, setIsOpen] = useState(false);

  // Atualiza o input quando a data externa muda
  useEffect(() => {
    setInputValue(format(date, 'dd/MM/yyyy'));
  }, [date]);

  // Valida e processa a entrada manual
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Validação simples para formato DD/MM/YYYY
    if (value.length === 10) {
      const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = value.match(regex);

      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // mês em JS é 0-based
        const year = parseInt(match[3], 10);

        const newDate = new Date(year, month, day);

        // Verifica se é uma data válida
        if (
          newDate.getDate() === day &&
          newDate.getMonth() === month &&
          newDate.getFullYear() === year
        ) {
          // Verifica restrição de data futura
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (!allowFutureDates && newDate > today) {
            toast.error('Datas futuras não são permitidas');
            return;
          }

          setDate(newDate);
          return;
        }
      }
      
      // Se chegou aqui, o formato está correto mas a data é inválida
      toast.error('Data inválida');
    }
  };

  // Desabilita datas futuras no calendário
  const disabledDays = !allowFutureDates 
    ? { after: new Date() } 
    : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor="date-input" className="text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-full",
                !date && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <Input
                id="date-input"
                className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="DD/MM/AAAA"
                value={inputValue}
                onChange={handleInputChange}
                disabled={disabled}
              />
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => {
                if (date) {
                  setDate(date);
                  setIsOpen(false);
                }
              }}
              disabled={disabledDays}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DatePicker;
