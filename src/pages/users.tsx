
import React, { useState } from 'react';
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
import { Search, X, User, Users as UsersIcon, Edit, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Navigate } from 'react-router-dom';

const Users: React.FC = () => {
  const { isAdmin } = useAuth();
  const { users, updateUserStatus, updateUserRole } = useData();
  const [search, setSearch] = useState('');
  
  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  // Filter users by search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.registration.toLowerCase().includes(search.toLowerCase())
  );
  
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os usuários e permissões do sistema
        </p>
      </div>
      
      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
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
                Tente usar termos diferentes na busca.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.registration}</TableCell>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleUserRole(user.id, user.role)}
                          title={user.role === 'admin' ? 'Remover privilégios de administrador' : 'Tornar administrador'}
                          className={user.role === 'admin' ? 'text-blue-600 hover:text-blue-700' : 'text-slate-600 hover:text-slate-700'}
                        >
                          {user.role === 'admin' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
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
    </div>
  );
};

export default Users;
