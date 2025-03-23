
import React from 'react';
import { Check, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type FilterOption = 'all' | 'admin' | 'user' | 'active' | 'inactive';

interface UserFiltersProps {
  activeFilters: FilterOption[];
  toggleFilter: (filter: FilterOption) => void;
  getFilterCount: () => number;
}

const UserFilters: React.FC<UserFiltersProps> = ({ 
  activeFilters, 
  toggleFilter, 
  getFilterCount 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1">
          <Filter size={16} />
          <span>Filtros</span>
          {getFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1">
              {getFilterCount()}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={() => toggleFilter('all')}
            className="flex items-center justify-between"
          >
            <span>Todos</span>
            {activeFilters.includes('all') && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Perfil</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={() => toggleFilter('admin')}
            className="flex items-center justify-between"
          >
            <span>Administradores</span>
            {activeFilters.includes('admin') && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => toggleFilter('user')}
            className="flex items-center justify-between"
          >
            <span>Usuários Comuns</span>
            {activeFilters.includes('user') && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={() => toggleFilter('active')}
            className="flex items-center justify-between"
          >
            <span>Ativos</span>
            {activeFilters.includes('active') && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => toggleFilter('inactive')}
            className="flex items-center justify-between"
          >
            <span>Inativos</span>
            {activeFilters.includes('inactive') && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserFilters;
