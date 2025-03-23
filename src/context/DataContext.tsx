import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/lib/toast';

// Define interfaces
export interface Product {
  id: string;
  name: string;
  code: string;
  capacity: number; // in ml
}

export interface ExchangeItem {
  id: string;
  productId: string;
  quantity: number;
  reason: string;
  photos: string[]; // Base64 encoded images
}

export interface Exchange {
  id: string;
  userId: string;
  userName: string;
  userRegistration: string;
  label: string;
  type: 'exchange' | 'breakage';
  items: ExchangeItem[];
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface DataContextType {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  
  // Exchanges
  exchanges: Exchange[];
  addExchange: (exchange: Omit<Exchange, 'id' | 'createdAt'>) => void;
  updateExchange: (id: string, exchange: Partial<Exchange>) => void;
  deleteExchange: (id: string) => void;
  getExchange: (id: string) => Exchange | undefined;
  
  // Users (only for admin)
  users: { id: string; name: string; registration: string; role: string; status: string }[];
  updateUserStatus: (id: string, status: 'active' | 'inactive') => void;
  updateUserRole: (id: string, role: 'admin' | 'user') => void;
  
  // Loading state
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('logiswap_products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
      
      const storedExchanges = localStorage.getItem('logiswap_exchanges');
      if (storedExchanges) {
        setExchanges(JSON.parse(storedExchanges));
      }
      
      const storedUsers = localStorage.getItem('logiswap_users');
      if (storedUsers) {
        // Filter out passwords for security
        const usersWithoutPasswords = JSON.parse(storedUsers).map((user: any) => ({
          id: user.id,
          name: user.name,
          registration: user.registration,
          role: user.role,
          status: user.status
        }));
        setUsers(usersWithoutPasswords);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Products methods
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = {
      ...product,
      id: Date.now().toString()
    };
    
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    localStorage.setItem('logiswap_products', JSON.stringify(updatedProducts));
    toast.success('Produto adicionado com sucesso');
  };
  
  const updateProduct = (id: string, product: Partial<Product>) => {
    const updatedProducts = products.map(p => 
      p.id === id ? { ...p, ...product } : p
    );
    
    setProducts(updatedProducts);
    localStorage.setItem('logiswap_products', JSON.stringify(updatedProducts));
    toast.success('Produto atualizado com sucesso');
  };
  
  const deleteProduct = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    localStorage.setItem('logiswap_products', JSON.stringify(updatedProducts));
    toast.success('Produto removido com sucesso');
  };
  
  const getProduct = (id: string) => products.find(p => p.id === id);

  // Exchanges methods
  const addExchange = (exchange: Omit<Exchange, 'id' | 'createdAt'>) => {
    const newExchange = {
      ...exchange,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const updatedExchanges = [...exchanges, newExchange];
    setExchanges(updatedExchanges);
    localStorage.setItem('logiswap_exchanges', JSON.stringify(updatedExchanges));
    toast.success('Registro adicionado com sucesso');
  };
  
  const updateExchange = (id: string, exchangeUpdate: Partial<Exchange>) => {
    const updatedExchanges = exchanges.map(e => 
      e.id === id ? { ...e, ...exchangeUpdate, updatedAt: new Date().toISOString() } : e
    );
    
    setExchanges(updatedExchanges);
    localStorage.setItem('logiswap_exchanges', JSON.stringify(updatedExchanges));
    toast.success('Registro atualizado com sucesso');
  };
  
  const deleteExchange = (id: string) => {
    const updatedExchanges = exchanges.filter(e => e.id !== id);
    setExchanges(updatedExchanges);
    localStorage.setItem('logiswap_exchanges', JSON.stringify(updatedExchanges));
    toast.success('Registro removido com sucesso');
  };
  
  const getExchange = (id: string) => exchanges.find(e => e.id === id);

  // Users methods (admin only)
  const updateUserStatus = (id: string, status: 'active' | 'inactive') => {
    // Update users state
    const updatedUsers = users.map(u => 
      u.id === id ? { ...u, status } : u
    );
    setUsers(updatedUsers);
    
    // Update users in localStorage (including passwords)
    const storedUsers = JSON.parse(localStorage.getItem('logiswap_users') || '[]');
    const updatedStoredUsers = storedUsers.map((u: any) => 
      u.id === id ? { ...u, status } : u
    );
    localStorage.setItem('logiswap_users', JSON.stringify(updatedStoredUsers));
    
    toast.success(`Usuário ${status === 'active' ? 'ativado' : 'desativado'} com sucesso`);
  };
  
  const updateUserRole = (id: string, role: 'admin' | 'user') => {
    // Update users state
    const updatedUsers = users.map(u => 
      u.id === id ? { ...u, role } : u
    );
    setUsers(updatedUsers);
    
    // Update users in localStorage (including passwords)
    const storedUsers = JSON.parse(localStorage.getItem('logiswap_users') || '[]');
    const updatedStoredUsers = storedUsers.map((u: any) => 
      u.id === id ? { ...u, role } : u
    );
    localStorage.setItem('logiswap_users', JSON.stringify(updatedStoredUsers));
    
    toast.success(`Perfil do usuário alterado para ${role === 'admin' ? 'Administrador' : 'Usuário'}`);
  };

  return (
    <DataContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        
        exchanges,
        addExchange,
        updateExchange,
        deleteExchange,
        getExchange,
        
        users,
        updateUserStatus,
        updateUserRole,
        
        isLoading
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use data context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
