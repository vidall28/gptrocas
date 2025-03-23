
import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  X, 
  User, 
  Users as UsersIcon, 
  ShieldCheck, 
  ShieldOff,
  ArrowUpDown,
  UserPlus,
  Filter,
  Check
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Navigate } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

type SortField = 'name' | 'registration' | 'role' | 'status';
type SortOrder = 'asc' | 'desc';
type FilterOption = 'all' | 'admin' | 'user' | 'active' | 'inactive';

const Users: React.FC = () => {
  const { isAdmin } = useAuth();
  const { users, updateUserStatus, updateUserRole } = useData();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>(['all']);
  
  // Delete User dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  const toggleFilter = (filter: FilterOption) => {
    if (filter === 'all') {
      setActiveFilters(['all']);
      return;
    }
    
    // Remove 'all' filter if it's active
    const newFilters = activeFilters.filter(f => f !== 'all');
    
    // Toggle the selected filter
    if (newFilters.includes(filter)) {
      const updatedFilters = newFilters.filter(f => f !== filter);
      setActiveFilters(updatedFilters.length === 0 ? ['all'] : updatedFilters);
    } else {
      setActiveFilters([...newFilters, filter]);
    }
  };
  
  // Filter users by search and active filters
  const filteredUsers = useMemo(() => {
    let result = users;
    
    // Apply search filter
    if (search) {
      result = result.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.registration.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply role/status filters
    if (!activeFilters.includes('all')) {
      result = result.filter(user => {
        const roleMatch = activeFilters.includes('admin') && user.role === 'admin' || 
                         activeFilters.includes('user') && user.role === 'user';
        const statusMatch = activeFilters.includes('active') && user.status === 'active' || 
                           activeFilters.includes('inactive') && user.status === 'inactive';
        
        return (activeFilters.includes('admin') || activeFilters.includes('user')) 
          ? roleMatch 
          : statusMatch;
      });
    }
    
    // Apply sorting
    return result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'registration':
          comparison = a.registration.localeCompare(b.registration);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [users, search, sortField, sortOrder, activeFilters]);
  
  // Toggle user status
  const toggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateUserStatus(userId, newStatus as 'active' | 'inactive');
  };
  
  // Toggle user role
  const toggleUserRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateUserRole(userId, newRole as 'admin' | 'user');
  };

  // Handle user deletion
  const confirmDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };
  
  const deleteUser = () => {
    if (userToDelete) {
      // Implementation will be added later - for now just close the dialog
      toast.info('Funcionalidade de exclusão será implementada em breve');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Highlight search match
  const highlightSearchMatch = (text: string) => {
    if (!search.trim()) return text;
    
    const lowerText = text.toLowerCase();
    const lowerSearch = search.toLowerCase();
    const index = lowerText.indexOf(lowerSearch);
    
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + search.length);
    const after = text.substring(index + search.length);
    
    return (
      <>
        {before}
        <span className="bg-yellow-200 dark:bg-yellow-800">{match}</span>
        {after}
      </>
    );
  };
  
  // Get filter badge count
  const getFilterCount = () => {
    return activeFilters.includes('all') ? 0 : activeFilters.length;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários e permissões do sistema
          </p>
        </div>
        <Button className="gap-1">
          <UserPlus size={16} className="mr-1" /> Novo Usuário
        </Button>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou matrícula..."
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
      </div>
      
      {/* Users List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UsersIcon className="h-4 w-4" /> Usuários
          </CardTitle>
          <CardDescription>
            Gerencie os usuários e permissões do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum usuário cadastrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ainda não existem usuários no sistema.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tente usar termos diferentes na busca ou ajustar os filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 -ml-3 font-medium p-0 h-auto"
                        onClick={() => toggleSort('name')}
                      >
                        Nome
                        <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 -ml-3 font-medium p-0 h-auto"
                        onClick={() => toggleSort('registration')}
                      >
                        Matrícula
                        <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 -ml-3 font-medium p-0 h-auto"
                        onClick={() => toggleSort('role')}
                      >
                        Perfil
                        <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 -ml-3 font-medium p-0 h-auto"
                        onClick={() => toggleSort('status')}
                      >
                        Status
                        <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={search && (user.name.toLowerCase().includes(search.toLowerCase()) || 
                    user.registration.toLowerCase().includes(search.toLowerCase())) 
                    ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}>
                      <TableCell className="font-medium">{highlightSearchMatch(user.name)}</TableCell>
                      <TableCell>{highlightSearchMatch(user.registration)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.role === 'admin'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                              : 'bg-slate-100 text-slate-800 hover:bg-slate-100'
                          }
                          variant="outline"
                        >
                          {user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.status === 'active'}
                            onCheckedChange={() => toggleUserStatus(user.id, user.status)}
                          />
                          <span className={user.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleUserRole(user.id, user.role)}
                            title={user.role === 'admin' ? 'Remover privilégios de administrador' : 'Tornar administrador'}
                            className={user.role === 'admin' ? 'text-blue-600 hover:text-blue-700' : 'text-slate-600 hover:text-slate-700'}
                          >
                            {user.role === 'admin' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => confirmDeleteUser(user.id)}
                            title="Excluir usuário"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Tem certeza que deseja excluir este usuário?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteUser}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
