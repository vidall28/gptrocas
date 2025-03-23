
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteUserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onDelete: () => void;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ 
  isOpen, 
  setIsOpen, 
  onDelete 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Tem certeza que deseja excluir este usuário?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserDialog;
