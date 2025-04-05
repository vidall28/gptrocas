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
  const { login, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    if (user) {
      console.log("Usuário já autenticado, redirecionando para dashboard...");
      setTimeout(() => {
        try {
          navigate('/dashboard');
          console.log("Navegação para dashboard realizada com sucesso");
        } catch (error) {
          console.error("Erro na navegação:", error);
          window.location.href = '/dashboard';
        }
      }, 500);
    }
  }, [user, navigate]);
  
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
        
        // Redirecionamento será feito pelo useEffect quando o usuário for atualizado
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert(error.message || 'Ocorreu um erro. Tente novamente.');
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
        
        {/* Botão alternativo de redirecionamento manual - apenas para teste */}
        {user && (
          <div className="text-center p-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="mt-4"
            >
              Redirecionamento Manual para Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
