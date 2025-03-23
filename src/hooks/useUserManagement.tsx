
import { useState, useMemo } from 'react';
import { FilterOption } from '@/components/users/UserFilters';

interface UserData {
  id: string;
  name: string;
  registration: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

type SortField = 'name' | 'registration' | 'role' | 'status';
type SortOrder = 'asc' | 'desc';

export const useUserManagement = (users: UserData[]) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>(['all']);
  
  // Toggle sort order
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Toggle filter
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
  
  // Get filter count
  const getFilterCount = () => {
    return activeFilters.includes('all') ? 0 : activeFilters.length;
  };
  
  // Filter users by search term and active filters
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
  
  return {
    search,
    setSearch,
    sortField,
    sortOrder,
    activeFilters,
    filteredUsers,
    toggleSort,
    toggleFilter,
    getFilterCount,
    highlightSearchMatch
  };
};
