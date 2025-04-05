import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Database, FileText, RefreshCw, ShieldAlert, Terminal, X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ScrollArea } from '@/components/ui/scroll-area';

// Estado inicial
type StatusInfo = {
  status: 'checking' | 'success' | 'error' | 'warning' | 'idle';
  message: string;
  details?: string;
};

// Componente de diagnóstico para verificar e corrigir problemas no sistema
const Diagnostico: React.FC = () => {
  // Estados para controlar os diferentes testes
  const [authStatus, setAuthStatus] = useState<StatusInfo>({ status: 'idle', message: 'Não verificado' });
  const [dbStatus, setDbStatus] = useState<StatusInfo>({ status: 'idle', message: 'Não verificado' });
  const [rlsStatus, setRlsStatus] = useState<StatusInfo>({ status: 'idle', message: 'Não verificado' });
  const [exchangeStatus, setExchangeStatus] = useState<StatusInfo>({ status: 'idle', message: 'Não verificado' });
  const [repairStatus, setRepairStatus] = useState<StatusInfo>({ status: 'idle', message: 'Não iniciado' });
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Adicionar log
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Verificar status de autenticação
  const checkAuth = async () => {
    setAuthStatus({ status: 'checking', message: 'Verificando autenticação...' });
    addLog('Verificando status de autenticação');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setAuthStatus({ 
          status: 'error', 
          message: 'Erro ao verificar autenticação', 
          details: error.message 
        });
        addLog(`Erro na autenticação: ${error.message}`);
        return false;
      }
      
      if (data.session) {
        setSessionInfo(data.session);
        
        // Verificar se o usuário é administrador
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
          
        if (userError) {
          setAuthStatus({ 
            status: 'warning', 
            message: 'Autenticado, mas erro ao verificar perfil', 
            details: userError.message 
          });
          addLog(`Autenticado, mas erro ao verificar perfil: ${userError.message}`);
          return true;
        }
        
        const userIsAdmin = userData.role === 'admin';
        setIsAdmin(userIsAdmin);
        
        setAuthStatus({ 
          status: 'success', 
          message: `Autenticado como ${userIsAdmin ? 'administrador' : 'usuário normal'}`,
          details: `User ID: ${data.session.user.id}`
        });
        addLog(`Autenticado como ${userIsAdmin ? 'administrador' : 'usuário normal'}`);
        return true;
      } else {
        setAuthStatus({ 
          status: 'warning', 
          message: 'Não autenticado', 
          details: 'Faça login para acessar todas as funcionalidades'
        });
        addLog('Não autenticado');
        return false;
      }
    } catch (err: any) {
      setAuthStatus({ 
        status: 'error', 
        message: 'Erro ao verificar autenticação', 
        details: err.message 
      });
      addLog(`Erro crítico na verificação de autenticação: ${err.message}`);
      return false;
    }
  };

  // Verificar conexão com o banco de dados
  const checkDatabase = async () => {
    setDbStatus({ status: 'checking', message: 'Verificando conexão com o banco de dados...' });
    addLog('Verificando conexão com o banco de dados');
    
    try {
      const startTime = performance.now();
      const { data, error } = await supabase.from('exchanges').select('count').limit(1);
      const endTime = performance.now();
      
      if (error) {
        setDbStatus({ 
          status: 'error', 
          message: 'Erro ao conectar ao banco de dados', 
          details: error.message 
        });
        addLog(`Erro na conexão com o banco: ${error.message}`);
        return false;
      }
      
      setDbStatus({ 
        status: 'success', 
        message: 'Conexão com o banco de dados estabelecida', 
        details: `Tempo de resposta: ${(endTime - startTime).toFixed(2)}ms` 
      });
      addLog(`Conexão com banco de dados bem-sucedida (${(endTime - startTime).toFixed(2)}ms)`);
      return true;
    } catch (err: any) {
      setDbStatus({ 
        status: 'error', 
        message: 'Erro ao verificar banco de dados', 
        details: err.message 
      });
      addLog(`Erro crítico na verificação do banco: ${err.message}`);
      return false;
    }
  };

  // Verificar políticas RLS
  const checkRLS = async () => {
    if (!isAdmin) {
      setRlsStatus({ 
        status: 'warning', 
        message: 'Necessário login como administrador', 
        details: 'Faça login como administrador para verificar as políticas RLS' 
      });
      addLog('Verificação de RLS ignorada: não é administrador');
      return false;
    }
    
    setRlsStatus({ status: 'checking', message: 'Verificando políticas RLS...' });
    addLog('Verificando políticas RLS para aprovações');
    
    try {
      // Esta função SQL retorna as políticas RLS para a tabela exchanges
      const { data, error } = await supabase.rpc('check_exchange_policies');
      
      if (error) {
        // Tente uma abordagem alternativa se a função RPC não existir
        try {
          const { data: policiesData, error: policiesError } = await supabase.from('pg_policies')
            .select('*')
            .ilike('tablename', 'exchanges');
            
          if (policiesError) {
            setRlsStatus({ 
              status: 'error', 
              message: 'Erro ao verificar políticas RLS', 
              details: policiesError.message 
            });
            addLog(`Erro ao verificar políticas RLS: ${policiesError.message}`);
            return false;
          }
          
          const hasAdminPolicy = policiesData.some(
            p => p.policyname.toLowerCase().includes('admin') && p.cmd === 'UPDATE'
          );
          
          if (hasAdminPolicy) {
            setRlsStatus({ 
              status: 'success', 
              message: 'Políticas RLS configuradas corretamente', 
              details: `${policiesData.length} políticas encontradas` 
            });
            addLog('Políticas RLS estão configuradas corretamente');
            return true;
          } else {
            setRlsStatus({ 
              status: 'warning', 
              message: 'Políticas RLS podem precisar de ajustes', 
              details: 'Não foi encontrada uma política específica para administradores' 
            });
            addLog('Políticas RLS podem precisar de ajustes (não encontrada política para admin)');
            return false;
          }
        } catch (err) {
          setRlsStatus({ 
            status: 'error', 
            message: 'Erro ao verificar políticas RLS', 
            details: error.message 
          });
          addLog(`Erro ao verificar políticas RLS: ${error.message}`);
          return false;
        }
      }
      
      if (data && data.result === 'ok') {
        setRlsStatus({ 
          status: 'success', 
          message: 'Políticas RLS configuradas corretamente', 
          details: data.details 
        });
        addLog('Políticas RLS estão configuradas corretamente');
        return true;
      } else {
        setRlsStatus({ 
          status: 'warning', 
          message: 'Políticas RLS podem precisar de ajustes', 
          details: data?.details || 'Detalhes não disponíveis' 
        });
        addLog(`Verificação de RLS: ${data?.details || 'Resultados incompletos'}`);
        return false;
      }
    } catch (err: any) {
      setRlsStatus({ 
        status: 'error', 
        message: 'Erro ao verificar políticas RLS', 
        details: err.message 
      });
      addLog(`Erro crítico na verificação de RLS: ${err.message}`);
      return false;
    }
  };

  // Verificar trocas/aprovações
  const checkExchanges = async () => {
    setExchangeStatus({ status: 'checking', message: 'Verificando trocas e aprovações...' });
    addLog('Verificando status das trocas e aprovações');
    
    try {
      const { data, error } = await supabase
        .from('exchanges')
        .select('id, status, updated_by, updated_at')
        .order('updated_at', { ascending: false })
        .limit(100);
        
      if (error) {
        setExchangeStatus({ 
          status: 'error', 
          message: 'Erro ao verificar trocas', 
          details: error.message 
        });
        addLog(`Erro ao verificar trocas: ${error.message}`);
        return false;
      }
      
      if (!data || data.length === 0) {
        setExchangeStatus({ 
          status: 'warning', 
          message: 'Nenhuma troca encontrada', 
          details: 'O sistema não possui registros de trocas para diagnóstico' 
        });
        addLog('Diagnóstico limitado: nenhuma troca encontrada');
        return true;
      }
      
      // Verificar problemas comuns
      const problemExchanges = data.filter(e => 
        (e.status !== 'pending' && (!e.updated_by || !e.updated_at))
      );
      
      if (problemExchanges.length > 0) {
        setExchangeStatus({ 
          status: 'warning', 
          message: `Encontrados ${problemExchanges.length} registros com problemas`, 
          details: 'Alguns registros possuem status alterado sem informações completas' 
        });
        addLog(`Encontrados ${problemExchanges.length} registros com problemas de atualização`);
        return false;
      }
      
      setExchangeStatus({ 
        status: 'success', 
        message: 'Trocas e aprovações verificadas com sucesso', 
        details: `${data.length} registros analisados sem problemas detectados` 
      });
      addLog('Verificação de trocas concluída sem problemas detectados');
      return true;
    } catch (err: any) {
      setExchangeStatus({ 
        status: 'error', 
        message: 'Erro ao verificar trocas', 
        details: err.message 
      });
      addLog(`Erro crítico na verificação de trocas: ${err.message}`);
      return false;
    }
  };

  // Reparar problemas encontrados
  const repairIssues = async () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem executar reparos');
      addLog('Tentativa de reparo negada: não é administrador');
      return;
    }
    
    setIsBusy(true);
    setRepairStatus({ status: 'checking', message: 'Reparando problemas...' });
    addLog('Iniciando reparo de problemas identificados');
    
    try {
      // 1. Corrigir trocas sem updated_by
      const { data: adminData } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();
        
      if (!adminData) {
        setRepairStatus({ 
          status: 'error', 
          message: 'Não foi possível encontrar um administrador', 
          details: 'É necessário um administrador para atribuir às trocas' 
        });
        addLog('Reparo falhou: não foi possível encontrar um administrador');
        setIsBusy(false);
        return;
      }
      
      const adminId = adminData.id;
      addLog(`Usando administrador ID ${adminId} para reparos`);
      
      // 2. Corrigir registros com problemas
      const { data: problemExchanges } = await supabase
        .from('exchanges')
        .select('id, status')
        .not('status', 'eq', 'pending')
        .is('updated_by', null);
        
      if (problemExchanges && problemExchanges.length > 0) {
        addLog(`Encontrados ${problemExchanges.length} registros para reparar`);
        
        // Tente usar a função RPC para reparos
        const { error: rpcError } = await supabase.rpc('repair_exchanges', {
          admin_id: adminId
        });
        
        if (rpcError) {
          addLog(`Tentando abordagem alternativa de reparo: ${rpcError.message}`);
          
          // Abordagem alternativa: atualizar cada registro individualmente
          let successCount = 0;
          for (const exchange of problemExchanges) {
            const { error } = await supabase
              .from('exchanges')
              .update({ 
                updated_by: adminId,
                updated_at: new Date().toISOString() 
              })
              .eq('id', exchange.id);
              
            if (!error) successCount++;
          }
          
          if (successCount === problemExchanges.length) {
            setRepairStatus({ 
              status: 'success', 
              message: `${successCount} registros reparados com sucesso`, 
              details: 'Todos os problemas identificados foram corrigidos' 
            });
            addLog(`Reparo bem-sucedido: ${successCount} registros atualizados`);
          } else {
            setRepairStatus({ 
              status: 'warning', 
              message: `${successCount} de ${problemExchanges.length} registros reparados`, 
              details: 'Alguns registros não puderam ser corrigidos' 
            });
            addLog(`Reparo parcial: ${successCount}/${problemExchanges.length} registros atualizados`);
          }
        } else {
          setRepairStatus({ 
            status: 'success', 
            message: `${problemExchanges.length} registros reparados com sucesso`, 
            details: 'Reparo executado via procedimento armazenado' 
          });
          addLog(`Reparo bem-sucedido via RPC: ${problemExchanges.length} registros`);
        }
      } else {
        setRepairStatus({ 
          status: 'success', 
          message: 'Nenhum problema encontrado para reparar', 
          details: 'O sistema parece estar funcionando corretamente' 
        });
        addLog('Verificação completa: nenhum problema encontrado para reparo');
      }
      
      // Atualizar o status das verificações
      await Promise.all([
        checkExchanges(),
        checkRLS()
      ]);
      
      toast.success('Diagnóstico e reparo concluídos');
    } catch (err: any) {
      setRepairStatus({ 
        status: 'error', 
        message: 'Erro ao tentar reparar problemas', 
        details: err.message 
      });
      addLog(`Erro crítico durante o reparo: ${err.message}`);
      toast.error('Erro durante o reparo');
    } finally {
      setIsBusy(false);
    }
  };

  // Executar verificações ao inicializar
  useEffect(() => {
    const runInitialChecks = async () => {
      setIsBusy(true);
      addLog('Iniciando verificações de diagnóstico');
      
      const authOk = await checkAuth();
      const dbOk = await checkDatabase();
      
      if (authOk && dbOk) {
        await Promise.all([
          checkRLS(),
          checkExchanges()
        ]);
      }
      
      setIsBusy(false);
    };
    
    runInitialChecks();
  }, []);

  // Função para renderizar badges de status
  const renderStatusBadge = (status: StatusInfo['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Sucesso</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Erro</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Alerta</Badge>;
      case 'checking':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Verificando...</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Não verificado</Badge>;
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Diagnóstico do Sistema</h1>
        <p className="text-muted-foreground">
          Esta ferramenta verifica e repara problemas no sistema de trocas e aprovações
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        {/* Cartão de autenticação */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Status de autenticação
              </CardTitle>
              {renderStatusBadge(authStatus.status)}
            </div>
            <CardDescription>{authStatus.message}</CardDescription>
          </CardHeader>
          {authStatus.details && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{authStatus.details}</p>
            </CardContent>
          )}
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkAuth}
              disabled={isBusy || authStatus.status === 'checking'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar novamente
            </Button>
          </CardFooter>
        </Card>

        {/* Cartão de banco de dados */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Conexão com banco de dados
              </CardTitle>
              {renderStatusBadge(dbStatus.status)}
            </div>
            <CardDescription>{dbStatus.message}</CardDescription>
          </CardHeader>
          {dbStatus.details && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{dbStatus.details}</p>
            </CardContent>
          )}
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkDatabase}
              disabled={isBusy || dbStatus.status === 'checking'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar novamente
            </Button>
          </CardFooter>
        </Card>

        {/* Cartão de políticas RLS */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Políticas de segurança (RLS)
              </CardTitle>
              {renderStatusBadge(rlsStatus.status)}
            </div>
            <CardDescription>{rlsStatus.message}</CardDescription>
          </CardHeader>
          {rlsStatus.details && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{rlsStatus.details}</p>
            </CardContent>
          )}
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkRLS}
              disabled={isBusy || rlsStatus.status === 'checking' || !isAdmin}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar novamente
            </Button>
          </CardFooter>
        </Card>

        {/* Cartão de trocas/aprovações */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Status de trocas e aprovações
              </CardTitle>
              {renderStatusBadge(exchangeStatus.status)}
            </div>
            <CardDescription>{exchangeStatus.message}</CardDescription>
          </CardHeader>
          {exchangeStatus.details && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{exchangeStatus.details}</p>
            </CardContent>
          )}
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkExchanges}
              disabled={isBusy || exchangeStatus.status === 'checking'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar novamente
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Alerta para usuários não administradores */}
      {!isAdmin && authStatus.status === 'success' && (
        <Alert className="mb-6 border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Funcionalidades limitadas</AlertTitle>
          <AlertDescription>
            Algumas funcionalidades de diagnóstico e reparo estão disponíveis apenas para administradores.
          </AlertDescription>
        </Alert>
      )}

      {/* Seção de reparo */}
      <Card className="mb-6 bg-background border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Diagnóstico e reparo automático
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Execute esta função para reparar automaticamente os problemas detectados no sistema'
              : 'Faça login como administrador para acessar as funcionalidades de reparo'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {repairStatus.status !== 'idle' && (
            <div className="mb-4 flex items-center gap-2">
              {renderStatusBadge(repairStatus.status)}
              <span className="text-sm">{repairStatus.message}</span>
              {repairStatus.details && (
                <span className="text-xs text-muted-foreground"> — {repairStatus.details}</span>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => {
                checkAuth();
                checkDatabase();
                checkRLS();
                checkExchanges();
              }}
              variant="outline"
              disabled={isBusy}
            >
              Verificar tudo novamente
            </Button>
            
            <Button 
              onClick={repairIssues}
              disabled={isBusy || !isAdmin}
              variant={isAdmin ? "default" : "outline"}
            >
              {isBusy ? 'Processando...' : 'Reparar problemas'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs do diagnóstico */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Logs de diagnóstico</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLogs([])}
              disabled={logs.length === 0}
              title="Limpar logs"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] rounded border p-2 bg-muted/20">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum log de diagnóstico disponível
              </p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Diagnostico; 