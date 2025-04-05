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
  const { login, resetPassword, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
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
    const timer = setTimeout(checkAuthStuck, 3000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
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
          setLoginStuck(true);
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
    localStorage.setItem('login_success', 'true');
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-scale-in">
        {/* Logo and Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">LogiSwap</h1>
          <p className="mt-2 text-muted-foreground">Sistema de Gestão de Trocas e Quebras</p>
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
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="text-amber-700 font-semibold mb-2">Problema de Redirecionamento Detectado</h3>
            <p className="text-sm text-amber-600 mb-4">
              O sistema detectou que você está autenticado, mas o redirecionamento automático falhou.
              Use o botão abaixo para ir manualmente para o dashboard.
            </p>
            <Button 
              variant="outline" 
              onClick={forceRedirect}
              className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
            >
              Ir para o Dashboard Manualmente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
