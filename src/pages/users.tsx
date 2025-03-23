
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { UserPlus, Check } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Navigate } from 'react-router-dom';

// Import components
import UserSearch from '@/components/users/UserSearch';
import UserFilters from '@/components/users/UserFilters';
import UsersCard from '@/components/users/UsersCard';
import DeleteUserDialog from '@/components/users/DeleteUserDialog';

// Import hooks
import { useUserManagement } from '@/hooks/useUserManagement';

// Define a UserData interface que corresponde ao que o hook useUserManagement espera
interface UserData {
  id: string;
  name: string;
  registration: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

const Users: React.FC = () => {
  const { isAdmin } = useAuth();
  const { users: rawUsers, updateUserStatus, updateUserRole } = useData();
  
  // Convertemos os users brutos para o formato UserData
  const users: UserData[] = rawUsers.map(user => ({
    ...user,
    role: user.role === 'admin' ? 'admin' : 'user',
    status: user.status === 'active' ? 'active' : 'inactive'
  }));
  
  // Delete User dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  // User management hook
  const {
    search,
    setSearch,
    activeFilters,
    filteredUsers,
    toggleSort,
    toggleFilter,
    getFilterCount,
    highlightSearchMatch
  } = useUserManagement(users);
  
  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
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
        <UserSearch search={search} setSearch={setSearch} />
        <UserFilters 
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          getFilterCount={getFilterCount}
        />
      </div>
      
      {/* Users List */}
      <UsersCard 
        users={users}
        filteredUsers={filteredUsers}
        search={search}
        toggleUserStatus={toggleUserStatus}
        toggleUserRole={toggleUserRole}
        confirmDeleteUser={confirmDeleteUser}
        toggleSort={toggleSort}
        highlightSearchMatch={highlightSearchMatch}
      />
      
      {/* Delete User Confirmation Dialog */}
      <DeleteUserDialog 
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onDelete={deleteUser}
      />
    </div>
  );
};

export default Users;
