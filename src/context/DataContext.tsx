import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/lib/toast';
import { supabase, User, Tables, mappers } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { utils, write } from 'xlsx';
import { saveAs } from 'file-saver';

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
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  exportProductsToCSV: () => void;
  importProductsFromCSV: (csvData: string) => Promise<{ success: number; errors: number; errorDetails: string[] }>;
  
  // Exchanges
  exchanges: Exchange[];
  addExchange: (exchange: Omit<Exchange, 'id' | 'createdAt'>) => Promise<void>;
  updateExchange: (id: string, status: 'pending' | 'approved' | 'rejected', notes?: string, updatedBy?: string) => Promise<void>;
  deleteExchange: (id: string) => Promise<void>;
  getExchange: (id: string) => Exchange | undefined;
  
  // Users (only for admin)
  users: User[];
  updateUserStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
  updateUserRole: (id: string, role: 'admin' | 'user') => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Loading state
  isLoading: boolean;
  
  // New function
  exportarParaPlanilhaControle: (exchangeId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Carregar produtos do Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Verifique se o usuário está autenticado
        if (!user) {
          console.log('Não há usuário autenticado, ignorando carregamento de produtos');
          return;
        }
        
        console.log('Usuário autenticado, carregando produtos...');
        setIsLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
          
        if (error) {
          console.error('Erro ao carregar produtos:', error);
          throw error;
        }
        
        if (data) {
          console.log(`${data.length} produtos encontrados`);
          const mappedProducts = data.map(mappers.mapProductFromDB);
          console.log('Produtos mapeados e prontos para exibição');
          setProducts(mappedProducts);
        } else {
          console.log('Nenhum produto encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        toast.error('Erro ao carregar lista de produtos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [user]);

  // Carregar exchanges do Supabase
  useEffect(() => {
    const fetchExchanges = async () => {
      if (!user) {
        console.log('Não há usuário autenticado, ignorando fetchExchanges');
        // Limpar as trocas quando não há usuário autenticado para evitar dados antigos
        setExchanges([]);
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('========== INICIANDO BUSCA DE TROCAS/QUEBRAS ==========');
        console.log('Usuário atual:', user);
        setIsLoading(true);
        
        // Verificar novamente se o usuário ainda está autenticado
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          console.log('Sessão expirou durante a execução, cancelando fetchExchanges');
          setExchanges([]);
          setIsLoading(false);
          return;
        }
        
        // Primeiro, buscar todas as trocas/quebras
        console.log('Buscando trocas/quebras do Supabase...');
        const { data: exchangesData, error: exchangesError } = await supabase
          .from('exchanges')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (exchangesError) {
          console.error('Erro ao buscar trocas/quebras:', exchangesError);
          console.error('Detalhes do erro:', {
            code: exchangesError.code,
            message: exchangesError.message,
            details: exchangesError.details
          });
          throw exchangesError;
        }
        
        if (!exchangesData) {
          console.log('Nenhuma troca/quebra encontrada');
          return;
        }
        
        console.log(`Encontradas ${exchangesData.length} trocas/quebras`);
        
        // Para cada troca, buscar os dados do usuário e os itens
        console.log('Buscando itens e dados de usuários para cada troca/quebra...');
        const mappedExchanges: Exchange[] = await Promise.all(
          exchangesData.map(async (exchange) => {
            console.log(`Processando troca/quebra ID: ${exchange.id}, Label: ${exchange.label}`);
            
            // Buscar dados do usuário
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, name, registration')
              .eq('id', exchange.user_id)
              .single();
              
            if (userError) {
              console.error(`Erro ao buscar dados do usuário ${exchange.user_id}:`, userError);
              // Continuar com valores padrão mesmo se houver erro
            }
            
            // Buscar os itens desta troca
            const { data: itemsData, error: itemsError } = await supabase
              .from('exchange_items')
              .select('*')
              .eq('exchange_id', exchange.id);
              
            if (itemsError) {
              console.error(`Erro ao buscar itens da troca ${exchange.id}:`, itemsError);
              return null;
            }
            
            if (!itemsData || itemsData.length === 0) {
              console.warn(`Troca/quebra ID: ${exchange.id} não possui itens`);
              return {
                id: exchange.id,
                userId: exchange.user_id,
                userName: userData?.name || 'Usuário Desconhecido',
                userRegistration: userData?.registration || 'N/A',
                label: exchange.label,
                type: exchange.type,
                status: exchange.status,
                notes: exchange.notes || undefined,
                createdAt: exchange.created_at,
                updatedAt: exchange.updated_at || undefined,
                updatedBy: exchange.updated_by || undefined,
                items: [] // Troca sem itens
              };
            }
            
            console.log(`Encontrados ${itemsData.length} itens para a troca ${exchange.id}`);
            
            // Para cada item, buscar as fotos
            console.log(`Buscando fotos para os itens da troca ${exchange.id}...`);
            const itemsWithPhotos = await Promise.all(
              itemsData.map(async (item) => {
                const { data: photosData, error: photosError } = await supabase
                  .from('exchange_photos')
                  .select('photo_url')
                  .eq('exchange_item_id', item.id);
                  
                if (photosError) {
                  console.error(`Erro ao buscar fotos do item ${item.id}:`, photosError);
                  return {
                    id: item.id,
                    productId: item.product_id,
                    quantity: item.quantity,
                    reason: item.reason,
                    photos: []
                  };
                }
                
                if (!photosData || photosData.length === 0) {
                  console.warn(`Item ID: ${item.id} não possui fotos`);
                }
                
                return {
                  id: item.id,
                  productId: item.product_id,
                  quantity: item.quantity,
                  reason: item.reason,
                  photos: photosData ? photosData.map(photo => photo.photo_url) : []
                };
              })
            );
            
            // Filtrar itens nulos
            const validItems = itemsWithPhotos.filter(Boolean) as ExchangeItem[];
            
            // Mapear para o formato da aplicação
            return {
              id: exchange.id,
              userId: exchange.user_id,
              userName: userData?.name || 'Usuário Desconhecido',
              userRegistration: userData?.registration || 'N/A',
              label: exchange.label,
              type: exchange.type,
              status: exchange.status,
              notes: exchange.notes || undefined,
              createdAt: exchange.created_at,
              updatedAt: exchange.updated_at || undefined,
              updatedBy: exchange.updated_by || undefined,
              items: validItems
            };
          })
        );
        
        // Filtrar trocas inválidas
        const validExchanges = mappedExchanges.filter(Boolean) as Exchange[];
        console.log(`Total de trocas/quebras válidas encontradas: ${validExchanges.length}`);
        setExchanges(validExchanges);
        
        console.log('========== FIM DA BUSCA DE TROCAS/QUEBRAS ==========');
      } catch (error) {
        console.error('Erro ao carregar registros de trocas:', error);
        console.trace('Stack trace completo:');
        toast.error('Erro ao carregar registros de trocas. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExchanges();
  }, [user]);

  // Carregar usuários do Supabase (somente para admin)
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || user.role !== 'admin') return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          console.log('Dados brutos dos usuários do Supabase:', data);
          const mappedUsers = data.map(mappers.mapUserFromDB);
          console.log('Usuários mapeados após transformação:', mappedUsers);
          setUsers(mappedUsers);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Erro ao carregar lista de usuários');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [user]);

  // Products methods
  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      setIsLoading(true);
      
      console.log('========== INICIANDO ADIÇÃO DE PRODUTO ==========');
      console.log('Dados do produto:', product);
      console.log('Usuário atual:', user);
      
      // Validações adicionais
      if (!product.name || !product.code || !product.capacity) {
        console.error('Dados do produto incompletos:', product);
        throw new Error('Todos os campos do produto são obrigatórios');
      }
      
      if (!user) {
        console.error('Usuário não autenticado');
        throw new Error('Você precisa estar autenticado para adicionar produtos');
      }
      
      if (user.role !== 'admin') {
        console.error('Usuário não é administrador:', user);
        throw new Error('Apenas administradores podem adicionar produtos');
      }

      console.log('Iniciando requisição ao Supabase para adicionar produto');
      
      // Inserir produto no Supabase com timeout mais longo
      const { data, error } = await Promise.race([
        supabase
          .from('products')
          .insert([{
            name: product.name,
            code: product.code,
            capacity: product.capacity
          }])
          .select()
          .single(),
        new Promise<{data: null, error: Error}>((resolve) => 
          setTimeout(() => resolve({
            data: null, 
            error: new Error('Timeout ao adicionar produto')
          }), 15000)
        )
      ]) as any;
        
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        console.log('Código do erro:', error.code);
        console.log('Mensagem do erro:', error.message);
        console.log('Detalhes do erro:', error.details);
        
        // Verificar o tipo de erro para dar feedback mais preciso
        if (error.code === '42501') {
          throw new Error(`Erro de permissão: Você não tem permissão para adicionar produtos. Certifique-se de que seu usuário tem a role 'admin'.`);
        } else if (error.code === '23505') {
          throw new Error(`Já existe um produto com este código: ${product.code}`);
        } else if (error.message?.includes('timeout')) {
          throw new Error('A operação demorou muito tempo. Verifique sua conexão com o Supabase.');
        } else {
          throw error;
        }
      }
      
      // Adicionar ao state
      if (data) {
        console.log('Produto adicionado com sucesso:', data);
        const newProduct = mappers.mapProductFromDB(data);
        setProducts(prev => [...prev, newProduct]);
        toast.success('Produto adicionado com sucesso');
      } else {
        console.error('Erro: Produto não foi adicionado (sem dados retornados)');
        throw new Error('Erro ao adicionar produto: Nenhum dado retornado do servidor');
      }
      
      console.log('========== FIM DA ADIÇÃO DE PRODUTO ==========');
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      console.trace('Stack trace completo:');
      
      // Mostrar mensagem de erro mais detalhada para o usuário
      if (error instanceof Error) {
        toast.error(`Erro ao adicionar produto: ${error.message}`);
      } else {
        toast.error('Erro desconhecido ao adicionar produto');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      setIsLoading(true);
      console.log(`[DEBUG] Iniciando atualização do produto ID: ${id}`, product);
      
      // Verificar se o usuário é administrador
      if (!user || user.role !== 'admin') {
        console.error('Tentativa de atualização sem permissão de administrador');
        toast.error('Apenas administradores podem atualizar produtos');
        return;
      }
      
      // Atualizar produto no Supabase
      console.log(`[DEBUG] Enviando atualização para o Supabase...`);
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          code: product.code,
          capacity: product.capacity
        })
        .eq('id', id);
        
      if (error) {
        console.error('Erro na operação de atualização:', error);
        
        // Verificar se é um erro de permissão
        if (error.message.includes('permission') || error.message.includes('policy')) {
          toast.error('Erro de permissão: Verifique se você tem o papel de administrador corretamente configurado');
          console.error('Detalhes do erro de permissão:', error.message, error.details);
        } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast.error('Já existe um produto com este código');
        } else {
          toast.error(`Erro ao atualizar produto: ${error.message}`);
        }
        
        throw error;
      }
      
      // Atualizar no state
      setProducts(prev => 
        prev.map(p => p.id === id ? { ...p, ...product } : p)
      );
      
      console.log(`[DEBUG] Produto atualizado com sucesso`);
      toast.success('Produto atualizado com sucesso');
    } catch (error) {
      console.error('Erro detalhado na atualização do produto:', error);
      toast.error('Erro ao atualizar produto. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteProduct = async (id: string) => {
    try {
      setIsLoading(true);
      console.log(`[DEBUG] Iniciando exclusão do produto ID: ${id}`);
      
      // Verificar se o usuário é administrador
      if (!user || user.role !== 'admin') {
        console.error('Tentativa de exclusão sem permissão de administrador');
        toast.error('Apenas administradores podem excluir produtos');
        return;
      }
      
      // Verificar se o produto está sendo usado em alguma troca
      console.log(`[DEBUG] Verificando uso do produto em trocas...`);
      const { data: usedItems, error: checkError } = await supabase
        .from('exchange_items')
        .select('id')
        .eq('product_id', id)
        .limit(1);
        
      if (checkError) {
        console.error('Erro ao verificar uso do produto:', checkError);
        throw checkError;
      }
      
      if (usedItems && usedItems.length > 0) {
        console.log(`[DEBUG] Produto em uso em ${usedItems.length} trocas`);
        toast.error('Não é possível excluir este produto pois ele está sendo usado em registros de trocas');
        return;
      }
      
      // Excluir produto do Supabase
      console.log(`[DEBUG] Executando exclusão do produto...`);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Erro na operação de exclusão:', error);
        
        // Verificar se é um erro de permissão
        if (error.message.includes('permission') || error.message.includes('policy')) {
          toast.error('Erro de permissão: Verifique se você tem o papel de administrador corretamente configurado');
          console.error('Detalhes do erro de permissão:', error.message, error.details);
        } else {
          toast.error(`Erro ao excluir produto: ${error.message}`);
        }
        
        throw error;
      }
      
      // Remover do state
      setProducts(prev => prev.filter(p => p.id !== id));
      console.log(`[DEBUG] Produto excluído com sucesso`);
      toast.success('Produto removido com sucesso');
    } catch (error) {
      console.error('Erro detalhado na exclusão do produto:', error);
      toast.error('Erro ao excluir produto. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getProduct = (id: string) => products.find(p => p.id === id);

  const exportProductsToCSV = () => {
    try {
      // Criar cabeçalho
      let csvContent = 'nome,codigo,capacidade_ml\n';
      
      // Adicionar dados de produtos
      products.forEach(product => {
        // Escapar vírgulas e aspas para formato CSV correto
        const name = `"${product.name.replace(/"/g, '""')}"`;
        const code = `"${product.code.replace(/"/g, '""')}"`;
        
        const row = [
          name,
          code,
          product.capacity
        ].join(',');
        
        csvContent += row + '\n';
      });
      
      // Criar e baixar o arquivo CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `produtos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Lista de produtos exportada com sucesso');
    } catch (error) {
      console.error('Erro ao exportar produtos:', error);
      toast.error('Erro ao exportar produtos');
    }
  };
  
  const importProductsFromCSV = async (csvData: string): Promise<{ success: number; errors: number; errorDetails: string[] }> => {
    try {
      setIsLoading(true);
      
      const lines = csvData.split('\n');
      const header = lines[0].toLowerCase();
      
      // Verificar se o cabeçalho está no formato esperado
      if (!header.includes('nome') || !header.includes('codigo') || 
          !(header.includes('capacidade') || header.includes('capacidade_ml'))) {
        throw new Error('Formato de CSV inválido. O cabeçalho deve conter: nome, codigo, capacidade_ml');
      }
      
      // Preparar para processar
      const results = {
        success: 0,
        errors: 0,
        errorDetails: [] as string[]
      };
      
      // Encontrar índices das colunas
      const headerCols = header.split(',');
      const nameIndex = headerCols.findIndex(col => col.trim() === 'nome');
      const codeIndex = headerCols.findIndex(col => col.includes('codigo'));
      const capacityIndex = headerCols.findIndex(col => 
        col.includes('capacidade') || col.includes('capacidade_ml'));
      
      if (nameIndex === -1 || codeIndex === -1 || capacityIndex === -1) {
        throw new Error('Colunas obrigatórias não encontradas no CSV');
      }
      
      // Processar produtos - pulando o cabeçalho
      const productsToAdd = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Pular linhas vazias
        
        try {
          // Dividir linha do CSV corretamente, lidando com campos que têm aspas e vírgulas
          let fields: string[] = [];
          let inQuotes = false;
          let currentField = '';
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              fields.push(currentField);
              currentField = '';
            } else {
              currentField += char;
            }
          }
          fields.push(currentField); // Adicionar o último campo
          
          // Extrair dados
          const name = fields[nameIndex].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
          const code = fields[codeIndex].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
          const capacityStr = fields[capacityIndex].replace(/^"|"$/g, '').trim();
          
          if (!name || !code || !capacityStr) {
            throw new Error(`Linha ${i+1}: Campos obrigatórios ausentes`);
          }
          
          // Converter capacidade para número
          let capacity = parseInt(capacityStr);
          if (isNaN(capacity) || capacity <= 0) {
            throw new Error(`Linha ${i+1}: Capacidade inválida: ${capacityStr}`);
          }
          
          // Verificar se o código já existe nos produtos existentes
          if (products.some(p => p.code === code)) {
            throw new Error(`Linha ${i+1}: Código '${code}' já existe`);
          }
          
          // Verificar se o código já existe nos produtos a serem adicionados
          if (productsToAdd.some(p => p.code === code)) {
            throw new Error(`Linha ${i+1}: Código '${code}' duplicado na planilha`);
          }
          
          // Produto validado, adicionar à lista
          productsToAdd.push({
            name, 
            code, 
            capacity
          });
        } catch (error: any) {
          results.errors++;
          results.errorDetails.push(error.message || `Erro ao processar linha ${i+1}`);
        }
      }
      
      // Se tiver produtos para adicionar, fazer o insert em lote
      if (productsToAdd.length > 0) {
        const { data, error } = await supabase
          .from('products')
          .insert(productsToAdd)
          .select();
        
        if (error) {
          console.error('Erro ao inserir produtos:', error);
          throw new Error(`Erro ao inserir produtos: ${error.message}`);
        }
        
        // Adicionar produtos ao state local
        if (data) {
          const newProducts = data.map(mappers.mapProductFromDB);
          setProducts(prev => [...prev, ...newProducts]);
          results.success = newProducts.length;
        }
      }
      
      // Mostrar resultado
      if (results.success > 0) {
        toast.success(`${results.success} produtos importados com sucesso`);
      }
      
      if (results.errors > 0) {
        toast.error(`${results.errors} erros encontrados durante a importação`);
      }
      
      return results;
    } catch (error) {
      console.error('Erro ao importar produtos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao importar produtos';
      toast.error(errorMessage);
      return {
        success: 0,
        errors: 1,
        errorDetails: [errorMessage]
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função auxiliar para buscar uma troca completa e atualizar o state
  const fetchExchangeAndUpdateState = async (exchangeId: string) => {
    try {
      // Buscar a troca
      const { data: exchangeData, error: exchangeError } = await supabase
        .from('exchanges')
        .select('*')
        .eq('id', exchangeId)
        .single();
        
      if (exchangeError) {
        throw exchangeError;
      }
      
      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, registration')
        .eq('id', exchangeData.user_id)
        .single();
        
      if (userError) {
        console.error(`Erro ao buscar dados do usuário ${exchangeData.user_id}:`, userError);
        // Continuar com valores padrão
      }
      
      // Buscar os itens
      const { data: itemsData, error: itemsError } = await supabase
        .from('exchange_items')
        .select('*')
        .eq('exchange_id', exchangeId);
        
      if (itemsError) {
        throw itemsError;
      }
      
      // Para cada item, buscar as fotos
      const itemsWithPhotos = await Promise.all(
        itemsData.map(async (item) => {
          const { data: photosData, error: photosError } = await supabase
            .from('exchange_photos')
            .select('photo_url')
            .eq('exchange_item_id', item.id);
            
          if (photosError) {
            console.error('Erro ao buscar fotos do item:', photosError);
            return {
              id: item.id,
              productId: item.product_id,
              quantity: item.quantity,
              reason: item.reason,
              photos: []
            };
          }
          
          return {
            id: item.id,
            productId: item.product_id,
            quantity: item.quantity,
            reason: item.reason,
            photos: photosData.map(photo => photo.photo_url)
          };
        })
      );
      
      // Criar objeto de troca completo
      const completeExchange: Exchange = {
        id: exchangeData.id,
        userId: exchangeData.user_id,
        userName: userData?.name || 'Usuário Desconhecido',
        userRegistration: userData?.registration || 'N/A',
        label: exchangeData.label,
        type: exchangeData.type,
        status: exchangeData.status,
        notes: exchangeData.notes || undefined,
        createdAt: exchangeData.created_at,
        updatedAt: exchangeData.updated_at || undefined,
        updatedBy: exchangeData.updated_by || undefined,
        items: itemsWithPhotos as ExchangeItem[]
      };
      
      // Atualizar o state
      setExchanges(prev => {
        const existingIndex = prev.findIndex(e => e.id === exchangeId);
        if (existingIndex >= 0) {
          // Substituir o existente
          const newExchanges = [...prev];
          newExchanges[existingIndex] = completeExchange;
          return newExchanges;
        } else {
          // Adicionar o novo
          return [completeExchange, ...prev];
        }
      });
    } catch (error) {
      console.error('Erro ao buscar troca completa:', error);
      throw error;
    }
  };
  
  const updateExchange = async (
    id: string,
    status: 'pending' | 'approved' | 'rejected',
    notes?: string,
    updatedBy?: string
  ): Promise<void> => {
    try {
      console.log(`[DEBUG] Iniciando updateExchange para a troca ID: ${id}, novo status: ${status}`);
      setIsLoading(true);

      // Atualização IMEDIATA do estado local para feedback instantâneo ao usuário
      setExchanges((currentExchanges) => {
        return currentExchanges.map((exchange) => {
          if (exchange.id === id) {
            console.log(`[DEBUG] Atualizando estado local para troca ID: ${id}`);
            return {
              ...exchange,
              status: status,
              notes: notes || exchange.notes,
              updatedAt: new Date().toISOString(),
              updatedBy: updatedBy || user?.id || exchange.updatedBy
            };
          }
          return exchange;
        });
      });

      // Usar o ID do usuário atual se não for fornecido um ID específico
      const effectiveUpdatedBy = updatedBy || user?.id;
      
      // Dados para atualização com ID do usuário que fez a atualização
      const updateData = {
        status: status,
        notes: notes || null,
        updated_at: new Date().toISOString(),
        updated_by: effectiveUpdatedBy
      };

      console.log(`[DEBUG] Dados para atualização:`, updateData);

      // Estratégia principal: Atualização via API Supabase
      const { error } = await supabase
        .from('exchanges')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error(`[ERROR] Falha ao atualizar via API: ${error.message}`, error);
        
        // Estratégia alternativa: Tentativa direta via SQL (evita algumas restrições)
        console.log(`[DEBUG] Tentando atualização alternativa via SQL para troca ID: ${id}`);
        
        // Adicionamos um pequeno atraso para garantir consistência
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const { error: sqlError } = await supabase.rpc('update_exchange_status', {
          exchange_id: id,
          new_status: status,
          exchange_notes: notes || null,
          user_id: effectiveUpdatedBy
        });

        if (sqlError) {
          console.error(`[ERROR] Falha também na estratégia SQL: ${sqlError.message}`, sqlError);
          
          // Terceira tentativa: SQL direto sem função RPC
          console.log(`[DEBUG] Tentativa final com SQL direto para troca ID: ${id}`);
          const { error: directSqlError } = await supabase.rpc('emergency_update_exchange', {
            p_id: id,
            p_status: status,
            p_notes: notes || null,
            p_updated_by: effectiveUpdatedBy
          });

          if (directSqlError) {
            console.error(`[ERROR] Todas as tentativas falharam: ${directSqlError.message}`, directSqlError);
            throw new Error(`Falha ao atualizar troca após múltiplas tentativas: ${directSqlError.message}`);
          }
        }
      }

      console.log(`[DEBUG] Atualização concluída com sucesso para troca ID: ${id}`);
      
      // Busca imediata para confirmar a atualização no banco de dados
      try {
        const { data: confirmationData, error: confirmationError } = await supabase
          .from('exchanges')
          .select('status, updated_at, updated_by')
          .eq('id', id)
          .single();
        
        if (confirmationError) {
          console.warn(`[WARNING] Não foi possível confirmar a atualização: ${confirmationError.message}`);
        } else {
          console.log(`[INFO] Confirmação da atualização:`, confirmationData);
          if (confirmationData.status !== status) {
            console.warn(`[WARNING] O status não foi atualizado corretamente no banco de dados!`);
            console.warn(`[WARNING] Esperado: ${status}, Atual: ${confirmationData.status}`);
          } else {
            console.log(`[SUCCESS] Status atualizado corretamente para: ${status}`);
          }
        }
      } catch (confirmError) {
        console.warn(`[WARNING] Erro ao verificar a confirmação: ${confirmError}`);
      }
      
      // Atualiza os dados após um pequeno delay para garantir consistência
      setTimeout(() => {
        fetchExchangeAndUpdateState(id).catch(err => 
          console.error(`[ERROR] Falha ao atualizar dados da troca: ${err.message}`)
        );
      }, 800);
    } catch (error: any) {
      console.error(`[ERROR] Erro crítico ao atualizar troca: ${error.message}`);
      toast.error(`Erro ao atualizar status: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteExchange = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Buscar todos os itens da troca
      const { data: items, error: itemsError } = await supabase
        .from('exchange_items')
        .select('id')
        .eq('exchange_id', id);
        
      if (itemsError) {
        throw itemsError;
      }
      
      // Excluir todas as fotos de cada item
      for (const item of items) {
        const { error: photosError } = await supabase
          .from('exchange_photos')
          .delete()
          .eq('exchange_item_id', item.id);
          
        if (photosError) {
          throw photosError;
        }
      }
      
      // Excluir todos os itens
      const { error: deleteItemsError } = await supabase
        .from('exchange_items')
        .delete()
        .eq('exchange_id', id);
        
      if (deleteItemsError) {
        throw deleteItemsError;
      }
      
      // Excluir a troca principal
      const { error: deleteExchangeError } = await supabase
        .from('exchanges')
        .delete()
        .eq('id', id);
        
      if (deleteExchangeError) {
        throw deleteExchangeError;
      }
      
      // Atualizar o state
      setExchanges(prev => prev.filter(e => e.id !== id));
      
      toast.success('Registro removido com sucesso');
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast.error('Erro ao excluir registro');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getExchange = (id: string) => exchanges.find(e => e.id === id);

  // Users methods (admin only)
  const updateUserStatus = async (id: string, status: 'active' | 'inactive') => {
    try {
      setIsLoading(true);
      console.log(`[DEBUG] Iniciando atualização de status do usuário ID: ${id} para ${status}`);
      
      // Verificar se o usuário é administrador
      if (!user || user.role !== 'admin') {
        console.error('Tentativa de atualização de usuário sem permissão de administrador');
        toast.error('Apenas administradores podem atualizar usuários');
        return;
      }
      
      // Atualizar status no Supabase
      console.log(`[DEBUG] Enviando atualização para o Supabase...`);
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', id);
        
      if (error) {
        console.error('Erro na operação de atualização de usuário:', error);
        
        // Verificar se é um erro de permissão
        if (error.message.includes('permission') || error.message.includes('policy')) {
          toast.error('Erro de permissão: Verifique se você tem o papel de administrador corretamente configurado');
          console.error('Detalhes do erro de permissão:', error.message, error.details);
        } else {
          toast.error(`Erro ao atualizar status do usuário: ${error.message}`);
        }
        
        throw error;
      }
      
      // Atualizar no state
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
      
      console.log(`[DEBUG] Status do usuário atualizado com sucesso`);
      toast.success(`Usuário ${status === 'active' ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error('Erro detalhado na atualização de status do usuário:', error);
      toast.error('Erro ao atualizar status do usuário. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateUserRole = async (id: string, role: 'admin' | 'user') => {
    try {
      setIsLoading(true);
      console.log(`[DEBUG] Iniciando atualização de papel do usuário ID: ${id} para ${role}`);
      
      // Verificar se o usuário é administrador
      if (!user || user.role !== 'admin') {
        console.error('Tentativa de atualização de usuário sem permissão de administrador');
        toast.error('Apenas administradores podem atualizar usuários');
        return;
      }
      
      // Atualizar papel no Supabase
      console.log(`[DEBUG] Enviando atualização para o Supabase...`);
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', id);
        
      if (error) {
        console.error('Erro na operação de atualização de papel:', error);
        
        // Verificar se é um erro de permissão
        if (error.message.includes('permission') || error.message.includes('policy')) {
          toast.error('Erro de permissão: Verifique se você tem o papel de administrador corretamente configurado');
          console.error('Detalhes do erro de permissão:', error.message, error.details);
        } else {
          toast.error(`Erro ao atualizar papel do usuário: ${error.message}`);
        }
        
        throw error;
      }
      
      // Atualizar no state
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      
      console.log(`[DEBUG] Papel do usuário atualizado com sucesso`);
      toast.success(`Perfil do usuário alterado para ${role === 'admin' ? 'Administrador' : 'Usuário'}`);
    } catch (error) {
      console.error('Erro detalhado na atualização de papel do usuário:', error);
      toast.error('Erro ao atualizar perfil do usuário. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para excluir usuário
  const deleteUser = async (id: string) => {
    try {
      setIsLoading(true);
      console.log(`[DEBUG] Iniciando exclusão do usuário ID: ${id}`);
      
      // Verificar se o usuário é administrador
      if (!user || user.role !== 'admin') {
        console.error('Tentativa de exclusão de usuário sem permissão de administrador');
        toast.error('Apenas administradores podem excluir usuários');
        return;
      }
      
      // Verificar se está tentando excluir o próprio usuário
      if (id === user.id) {
        console.error('Tentativa de excluir o próprio usuário');
        toast.error('Você não pode excluir seu próprio usuário');
        return;
      }
      
      // Verificar se o usuário tem trocas/quebras associadas
      console.log(`[DEBUG] Verificando se o usuário tem trocas/quebras...`);
      const { data: userExchanges, error: checkError } = await supabase
        .from('exchanges')
        .select('id')
        .eq('user_id', id)
        .limit(1);
        
      if (checkError) {
        console.error('Erro ao verificar trocas do usuário:', checkError);
        throw checkError;
      }
      
      if (userExchanges && userExchanges.length > 0) {
        console.log(`[DEBUG] Usuário tem ${userExchanges.length} trocas/quebras`);
        toast.error('Não é possível excluir este usuário pois ele possui registros de trocas/quebras no sistema');
        return;
      }
      
      // Excluir usuário no Supabase
      console.log(`[DEBUG] Executando exclusão do usuário...`);
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Erro na operação de exclusão de usuário:', error);
        
        // Verificar se é um erro de permissão
        if (error.message.includes('permission') || error.message.includes('policy')) {
          toast.error('Erro de permissão: Verifique se você tem o papel de administrador corretamente configurado');
          console.error('Detalhes do erro de permissão:', error.message, error.details);
        } else if (error.message.includes('foreign key constraint') || error.message.includes('violates foreign key')) {
          toast.error('Não é possível excluir este usuário pois ele está vinculado a outros registros no sistema');
        } else {
          toast.error(`Erro ao excluir usuário: ${error.message}`);
        }
        
        throw error;
      }
      
      // Remover do state
      setUsers(prev => prev.filter(u => u.id !== id));
      console.log(`[DEBUG] Usuário excluído com sucesso`);
      toast.success('Usuário removido com sucesso');
    } catch (error) {
      console.error('Erro detalhado na exclusão do usuário:', error);
      toast.error('Erro ao excluir usuário. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Exchanges methods
  const addExchange = async (exchange: Omit<Exchange, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      
      // 1. Inserir a troca principal
      const { data: exchangeData, error: exchangeError } = await supabase
        .from('exchanges')
        .insert([{
          user_id: exchange.userId,
          label: exchange.label,
          type: exchange.type,
          status: exchange.status,
          notes: exchange.notes || null
        }])
        .select()
        .single();
        
      if (exchangeError) {
        throw exchangeError;
      }
      
      if (!exchangeData) {
        throw new Error('Erro ao criar registro de troca');
      }
      
      // 2. Inserir os itens da troca
      for (const item of exchange.items) {
        // Inserir o item
        const { data: itemData, error: itemError } = await supabase
          .from('exchange_items')
          .insert([{
            exchange_id: exchangeData.id,
            product_id: item.productId,
            quantity: item.quantity,
            reason: item.reason
          }])
          .select()
          .single();
          
        if (itemError) {
          throw itemError;
        }
        
        if (!itemData) {
          throw new Error('Erro ao adicionar item de troca');
        }
        
        // Inserir as fotos do item
        for (const photoUrl of item.photos) {
          const { error: photoError } = await supabase
            .from('exchange_photos')
            .insert([{
              exchange_item_id: itemData.id,
              photo_url: photoUrl
            }]);
            
          if (photoError) {
            throw photoError;
          }
        }
      }
      
      // Buscar a troca completa para atualizar o state
      await fetchExchangeAndUpdateState(exchangeData.id);
      
      toast.success('Registro adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar registro de troca:', error);
      toast.error('Erro ao adicionar registro');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para exportar para o formato da planilha de controle de trocas e quebras
  const exportarParaPlanilhaControle = async (exchangeId: string) => {
    try {
      setIsLoading(true);
      
      // Buscar a troca/quebra específica
      const exchange = exchanges.find(e => e.id === exchangeId);
      if (!exchange) {
        throw new Error('Registro não encontrado');
      }
      
      // Formatar a data atual no formato DD/MM/YYYY
      const hoje = new Date();
      const dataFormatada = hoje.toLocaleDateString('pt-BR');
      
      // Criar dados para a planilha
      const rows = [];
      
      // Adicionar cabeçalho
      const titulo = `CONTROLE DE TROCAS PARA QUEBRAS DO DIA ${dataFormatada.replace(/\//g, '/')}`;
      
      // Preparar dados de itens
      let und = 54; // Iniciar com 54 como na planilha exemplo
      
      for (const item of exchange.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;
        
        // Calcular o total (quantidade * valor unitário)
        // Estamos assumindo um valor fixo de R$ 2,00 como exemplo
        const valorUnitario = 2.00;
        const total = (item.quantity * valorUnitario).toFixed(2);
        
        rows.push({
          UND: und.toString(),
          CÓDIGO: product.code,
          DESCRIÇÃO: product.name,
          QUANT: item.quantity,
          MED: 'UN',
          $: 'R$',
          'VALOR UNITÁRIO': valorUnitario.toFixed(2),
          TOTAL: `R$ ${total}`,
          'MOTIVO QUEBRA/TROCA': exchange.type === 'breakage' ? 'ROPA MR QUEBRA' : 'ROPA MR MODO FUNO',
          IDENTIFICAÇÃO: '3233009',
          DATA: hoje.toLocaleDateString('pt-BR') + ' 00:00'
        });
        
        und++;
      }
      
      // Criar workbook
      const wb = utils.book_new();
      
      // Criar worksheet
      const ws = utils.json_to_sheet(rows);
      
      // Adicionar o título
      utils.sheet_add_aoa(ws, [[titulo]], { origin: 'A1' });
      
      // Mesclar células para o título
      if(!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({s: {r: 0, c: 0}, e: {r: 0, c: 10}});
      
      // Definir a largura das colunas
      const wscols = [
        { wch: 5 },  // UND
        { wch: 12 }, // CÓDIGO
        { wch: 40 }, // DESCRIÇÃO
        { wch: 10 }, // QUANT
        { wch: 5 },  // MED
        { wch: 5 },  // $
        { wch: 10 }, // VALOR UNITÁRIO
        { wch: 10 }, // TOTAL
        { wch: 25 }, // MOTIVO QUEBRA/TROCA
        { wch: 15 }, // IDENTIFICAÇÃO
        { wch: 20 }, // DATA
      ];
      
      ws['!cols'] = wscols;
      
      utils.book_append_sheet(wb, ws, "Controle");
      
      // Gerar arquivo
      const wbout = write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false,
        cellStyles: true
      });
      
      // Converter para blob e baixar
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `controle_${exchange.type === 'breakage' ? 'quebras' : 'trocas'}_${hoje.toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Planilha de controle exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar para planilha de controle:', error);
      toast.error('Erro ao exportar planilha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        exportProductsToCSV,
        importProductsFromCSV,
        
        exchanges,
        addExchange,
        updateExchange,
        deleteExchange,
        getExchange,
        
        users,
        updateUserStatus,
        updateUserRole,
        deleteUser,
        
        isLoading,
        exportarParaPlanilhaControle,
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
