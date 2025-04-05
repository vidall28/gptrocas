import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/supabase';

// Definição do contexto de autenticação
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (registration: string, name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Criação do contexto com valor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider do contexto de autenticação
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar sessão do usuário ao inicializar o contexto
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Verificando sessão...');
        setIsLoading(true);

        // Verificar se há uma sessão ativa
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Erro ao verificar sessão:', sessionError);
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (!sessionData.session) {
          console.log('Nenhuma sessão ativa encontrada');
          setUser(null);
          setIsLoading(false);
          return;
        }

        console.log('Sessão encontrada, recuperando dados do usuário...');
        const userId = sessionData.session.user.id;

        // Buscar dados do usuário na tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .eq('status', 'active')
          .single();

        if (userError || !userData) {
          console.error('Erro ao buscar dados do usuário ou usuário não encontrado:', userError);
          await supabase.auth.signOut();
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Definir usuário autenticado
        const currentUser: User = {
          id: userData.id,
          name: userData.name,
          registration: userData.registration,
          email: userData.email,
          role: userData.role || 'user',
          status: userData.status || 'active'
        };

        console.log('Usuário autenticado:', currentUser);
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Verificar sessão inicial
    checkSession();

    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Mudança no estado de autenticação:', event);
      
      if (event === 'SIGNED_IN' && session) {
        // Buscar dados do usuário após login
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .eq('status', 'active')
          .single();

        if (userError || !userData) {
          console.error('Erro ao buscar dados do usuário após login:', userError);
          return;
        }

        const currentUser: User = {
          id: userData.id,
          name: userData.name,
          registration: userData.registration,
          email: userData.email,
          role: userData.role || 'user',
          status: userData.status || 'active'
        };

        setUser(currentUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Limpar listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Função de login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Iniciando processo de login...');

      // Opções de persistência de sessão
      const persistenceOptions = {
        persistSession: true
      };

      // Autenticar com Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: persistenceOptions
      });

      if (authError || !authData.user) {
        console.error('Erro na autenticação:', authError);
        toast.error('Credenciais inválidas');
        return;
      }

      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('status', 'active')
        .single();

      if (userError || !userData) {
        console.error('Erro ao buscar dados do usuário:', userError);
        
        // Tentar criar registro de usuário ausente
        const userMetadata = authData.user.user_metadata;
        const userName = userMetadata?.name || authData.user.email?.split('@')[0] || 'Usuário';
        const userRegistration = userMetadata?.registration || '00000000';
        
        try {
          await supabase.rpc('fix_user_data', {
            user_id: authData.user.id,
            user_name: userName,
            user_registration: userRegistration,
            user_email: authData.user.email
          });
          
          // Buscar dados do usuário novamente
          const { data: fixedUserData, error: fixedUserError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
          if (fixedUserError || !fixedUserData) {
            toast.error('Usuário não encontrado ou inativo');
            return;
          }
          
          // Definir usuário após correção
          const currentUser: User = {
            id: fixedUserData.id,
            name: fixedUserData.name,
            registration: fixedUserData.registration,
            email: fixedUserData.email,
            role: fixedUserData.role || 'user',
            status: fixedUserData.status || 'active'
          };
          
          setUser(currentUser);
        } catch (error) {
          console.error('Erro ao tentar corrigir dados do usuário:', error);
          toast.error('Erro ao processar login. Entre em contato com o suporte.');
          return;
        }
      } else {
        // Login bem-sucedido
        const currentUser: User = {
          id: userData.id,
          name: userData.name,
          registration: userData.registration,
          email: userData.email,
          role: userData.role,
          status: userData.status
        };
        
        setUser(currentUser);
      }
      
      // Notificar usuário
      toast.success('Login realizado com sucesso!');
      
      // Verificar a sessão após o login
      const { data: sessionCheck } = await supabase.auth.getSession();
      console.log("Verificação de sessão após login:", 
                sessionCheck?.session ? "Sessão ativa" : "Sessão não encontrada");
      
      // Usar a página de redirecionamento para garantir navegação correta
      window.location.href = '/redirect.html';
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error('Erro ao realizar login: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const register = async (registration: string, name: string, email: string, password: string, confirmPassword: string) => {
    try {
      setIsLoading(true);
      console.log('Iniciando processo de registro:', { registration, name, email });
      
      // Validações
      if (password !== confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }
      
      if (registration.length !== 8 || !/^\d+$/.test(registration)) {
        toast.error('A matrícula deve conter 8 dígitos');
        return;
      }
      
      if (!name || name.trim() === '') {
        toast.error('O nome não pode estar vazio');
        return;
      }
      
      // Verificar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Formato de email inválido');
        return;
      }
      
      // Verificar email já cadastrado
      const { data: existingUsersByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email);
        
      if (existingUsersByEmail && existingUsersByEmail.length > 0) {
        toast.error('Email já cadastrado');
        return;
      }
      
      // Verificar matrícula já cadastrada
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('registration', registration)
        .single();
        
      if (existingUser) {
        toast.error('Matrícula já cadastrada');
        return;
      }
      
      // Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            registration: registration.trim(),
            name: name.trim()
          }
        }
      });
      
      if (authError || !authData.user) {
        toast.error('Erro ao criar conta: ' + (authError?.message || 'Erro desconhecido'));
        return;
      }
      
      // Preparar dados do usuário
      const userData = {
        id: authData.user.id,
        name: name.trim(),
        registration: registration.trim(),
        email: email,
        role: 'user',
        status: 'active'
      };
      
      // Inserir na tabela users
      const { error: insertError } = await supabase
        .from('users')
        .insert([userData]);
        
      if (insertError) {
        console.error('Erro ao inserir dados do usuário:', insertError);
        toast.error('Erro ao cadastrar dados. Tente novamente.');
        return;
      }
      
      toast.success('Cadastro realizado com sucesso!');
      toast.info('Você já pode fazer login com suas credenciais');
      navigate('/login');
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error('Erro ao realizar cadastro: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  // Função de recuperação de senha
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast.error('Erro ao enviar email de recuperação');
        return;
      }
      
      toast.success('Email de recuperação enviado com sucesso!');
      toast.info('Verifique sua caixa de entrada para redefinir sua senha.');
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      setIsLoading(true);
      console.log("Iniciando processo de logout...");
      
      // Limpar estado de usuário primeiro
      setUser(null);
      
      // Executar logout no Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Limpar dados de armazenamento local
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      toast.info('Sessão encerrada com sucesso');
      
      // Redirecionar para login
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      
      // Forçar logout mesmo após erro
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      
      toast.error('Ocorreu um erro, mas você foi desconectado');
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        resetPassword,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para utilizar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
