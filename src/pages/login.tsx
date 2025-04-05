import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, resetPassword, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Usuário já autenticado, redirecionando para o dashboard");
      navigateToDashboard();
    }
  }, [isAuthenticated, user]);

  // Função para navegação segura ao dashboard
  const navigateToDashboard = () => {
    try {
      // Tentativa 1: Usar React Router para navegação SPA
      navigate('/dashboard');
      
      // Tentativa 2: Em caso de falha, usar redirecionamento direto após timeout
      setTimeout(() => {
        if (window.location.pathname.includes('login')) {
          console.log("Redirecionamento via Router falhou, usando window.location");
          window.location.href = '/dashboard';
        }
      }, 1000);
    } catch (error) {
      console.error("Erro ao navegar:", error);
      // Tentativa 3: Fallback final
      window.location.href = '/dashboard';
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isResetMode) {
        await resetPassword(email);
        toast.success('Verifique seu email para as instruções de recuperação de senha.');
        setIsResetMode(false);
      } else {
        console.log("Iniciando processo de login...");
        await login(email, password);
        
        // Login bem-sucedido, aguardar breve momento para atualização de estado
        setTimeout(() => {
          if (isAuthenticated && user) {
            navigateToDashboard();
          } else {
            console.log("Estado de autenticação ainda não atualizado, tentando redirecionamento direto");
            window.location.href = '/redirect.html';
          }
        }, 500);
      }
    } catch (error) {
      console.error("Erro no login:", error);
      toast.error(error.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-scale-in">
        {/* Logo and Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">LogiSwap</h1>
          <p className="mt-2 text-muted-foreground">Sistema de Gestão de Trocas e Quebras</p>
        </div>
        
        {/* Opções de acesso alternativo */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
          <h3 className="text-amber-700 font-semibold mb-2">Opções de acesso</h3>
          <div className="flex flex-col gap-2">
            <a 
              href="/login-simples.html" 
              className="bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 px-4 py-2 rounded text-center text-sm font-bold"
            >
              USAR LOGIN SIMPLIFICADO (RECOMENDADO)
            </a>
            <a 
              href="/acesso-direto.html" 
              className="bg-red-500 hover:bg-red-600 text-white border border-red-600 px-4 py-3 rounded text-center text-sm font-bold mt-2 animate-pulse"
            >
              ⚠️ ACESSO DIRETO DE EMERGÊNCIA ⚠️
            </a>
          </div>
        </div>
        
        {/* Login Form */}
        <div className="bg-card p-8 rounded-lg shadow-sm border">
          <h2 className="text-xl font-medium mb-6 text-center">
            {isResetMode ? 'Recuperar Senha' : 'Login'}
          </h2>
          <p className="text-sm text-center text-muted-foreground mb-6">
            {isResetMode 
              ? 'Digite seu email para receber instruções de recuperação de senha' 
              : 'Entre com suas credenciais para acessar o sistema'}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-transition"
              />
            </div>
            
            {!isResetMode && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-transition"
                />
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (isResetMode ? 'Enviando...' : 'Entrando...') 
                : (isResetMode ? 'Enviar Instruções' : 'Entrar')}
            </Button>
            
            <div className="flex justify-between items-center mt-4">
              <button
                type="button"
                onClick={() => setIsResetMode(!isResetMode)}
                className="text-sm text-primary hover:underline"
              >
                {isResetMode ? 'Voltar ao login' : 'Esqueceu a senha?'}
              </button>
              
              <Link to="/register" className="text-sm text-primary hover:underline">
                Criar nova conta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
