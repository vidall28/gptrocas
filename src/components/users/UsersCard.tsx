
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users as UsersIcon } from 'lucide-react';
import UsersTable from './UsersTable';

interface UserData {
  id: string;
  name: string;
  registration: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

interface UsersCardProps {
  users: UserData[];
  filteredUsers: UserData[];
  search: string;
  toggleUserStatus: (userId: string, currentStatus: string) => void;
  toggleUserRole: (userId: string, currentRole: string) => void;
  confirmDeleteUser: (userId: string) => void;
  toggleSort: (field: 'name' | 'registration' | 'role' | 'status') => void;
  highlightSearchMatch: (text: string) => React.ReactNode;
}

const UsersCard: React.FC<UsersCardProps> = ({
  users,
  filteredUsers,
  search,
  toggleUserStatus,
  toggleUserRole,
  confirmDeleteUser,
  toggleSort,
  highlightSearchMatch
}) => {
  return (
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
        <UsersTable 
          users={users}
          filteredUsers={filteredUsers}
          search={search}
          toggleUserStatus={toggleUserStatus}
          toggleUserRole={toggleUserRole}
          confirmDeleteUser={confirmDeleteUser}
          toggleSort={toggleSort}
          highlightSearchMatch={highlightSearchMatch}
        />
      </CardContent>
    </Card>
  );
};

export default UsersCard;
