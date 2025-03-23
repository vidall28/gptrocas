
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';

const Login: React.FC = () => {
  const [registration, setRegistration] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registration || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(registration, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

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
          <h2 className="text-xl font-medium mb-6 text-center">Login</h2>
          <p className="text-sm text-center text-muted-foreground mb-6">
            Entre com suas credenciais para acessar o sistema
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="registration" className="text-sm font-medium">
                Matrícula
              </label>
              <Input
                id="registration"
                type="text"
                placeholder="Digite sua matrícula (formato: 00000000)"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                required
                pattern="\d{8}"
                title="A matrícula deve conter 8 dígitos"
                className="input-transition"
              />
            </div>
            
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
            
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não possui uma conta?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Registrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
