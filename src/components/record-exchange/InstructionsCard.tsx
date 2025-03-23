
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

const InstructionsCard: React.FC = () => {
  return (
    <Card>
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
  );
};

export default InstructionsCard;
