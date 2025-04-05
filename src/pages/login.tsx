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
  const [loginStuck, setLoginStuck] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { login, resetPassword, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Adicionar diagnóstico detalhado do estado atual
  console.log("### ESTADO ATUAL DA PÁGINA DE LOGIN ###");
  console.log("User:", user);
  console.log("isAuthenticated:", isAuthenticated);
  console.log("loginStuck:", loginStuck);
  console.log("isSubmitted:", isSubmitted);
  console.log("URL atual:", window.location.href);
  console.log("##########################################");
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    const checkAuthStuck = () => {
      // Verificar se há usuário autenticado mas não redirecionou
      if (isAuthenticated && user) {
        console.log("Usuário autenticado mas ainda na página de login - possível bug de redirecionamento");
        setLoginStuck(true);
      }
    };

    // Verificar imediatamente
    checkAuthStuck();
    
    // E também verificar após um tempo para dar chance de tudo ser carregado
    const timer = setTimeout(checkAuthStuck, 2000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);
  
  // Adicionar listener para verificar mudanças no localStorage para fins de diagnóstico
  useEffect(() => {
    const storageListener = () => {
      console.log("Alteração no localStorage detectada");
      console.log("Usuário autenticado após alteração:", !!user);
    };
    
    window.addEventListener('storage', storageListener);
    return () => window.removeEventListener('storage', storageListener);
  }, [user]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSubmitted(true);
    
    try {
      if (isResetMode) {
        await resetPassword(email);
        alert('Verifique seu email para as instruções de recuperação de senha.');
        setIsResetMode(false);
      } else {
        console.log("Iniciando processo de login...");
        await login(email, password);
        console.log("Login realizado com sucesso, aguardando redirecionamento...");
        
        // Em caso de falha no redirecionamento automático, ativar o estado de login travado
        setTimeout(() => {
          if (window.location.pathname.includes('login')) {
            console.log("ATENÇÃO: Ainda na página de login após 5 segundos desde o login bem-sucedido");
            setLoginStuck(true);
          }
        }, 5000);
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert(error.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const forceRedirect = () => {
    console.log("Forçando redirecionamento manual para dashboard");
    // Definir flag e redirecionar diretamente
    try {
      localStorage.setItem('dashboard_redirect', 'true');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error("Erro ao redirecionar:", error);
      // Tentativa alternativa
      window.location.replace('/dashboard');
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
        
        {/* Botão de diagnóstico sempre visível */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
          <h3 className="text-amber-700 font-semibold mb-2">Problemas para entrar?</h3>
          <p className="text-sm text-amber-600 mb-4">
            Se você já fez login mas não foi redirecionado, use o botão abaixo:
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              onClick={forceRedirect}
              className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
            >
              Ir para o Dashboard Manualmente
            </Button>
            <a 
              href="/acesso-emergencia.html" 
              className="text-amber-700 hover:underline text-sm font-semibold text-center"
            >
              Acessar Ferramenta de Diagnóstico Avançado
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
                : (isResetMode ? 'Enviar Email de Recuperação' : 'Entrar')}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {isResetMode ? (
                <button 
                  type="button" 
                  onClick={() => setIsResetMode(false)}
                  className="text-primary hover:underline"
                >
                  Voltar ao login
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setIsResetMode(true)}
                  className="text-primary hover:underline"
                >
                  Esqueceu sua senha?
                </button>
              )}
            </p>
            
            <p className="text-sm text-muted-foreground">
              Não possui uma conta?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Registrar
              </Link>
            </p>
          </div>
        </div>
        
        {/* Botão alternativo de redirecionamento manual - apenas para situações de emergência */}
        {loginStuck && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="text-red-700 font-semibold mb-2">Problema de Redirecionamento Detectado!</h3>
            <p className="text-sm text-red-600 mb-4">
              <strong>ATENÇÃO:</strong> O sistema detectou que você está autenticado, mas o redirecionamento automático falhou.
              Use o botão abaixo para resolver o problema:
            </p>
            <Button 
              variant="destructive" 
              onClick={forceRedirect}
              className="w-full"
            >
              ACESSAR DASHBOARD AGORA
            </Button>
          </div>
        )}
        
        {/* Status da Autenticação - somente para diagnóstico */}
        <div className="text-xs text-gray-500 text-center mt-4">
          <p>Status: {isAuthenticated ? 'Autenticado' : 'Não autenticado'}</p>
          {isAuthenticated && user && (
            <p>Usuário: {user.email} (ID: {user.id?.substring(0, 6)}...)</p>
          )}
        </div>
      </div>
    </div>
  );
}
