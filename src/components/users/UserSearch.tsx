
import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface UserSearchProps {
  search: string;
  setSearch: (value: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ search, setSearch }) => {
  return (
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
  );
};

export default UserSearch;
