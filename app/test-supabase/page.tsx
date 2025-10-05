"use client"

import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { testSupabaseConnection } from '@/lib/supabase-helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, Database, RefreshCw } from 'lucide-react'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<any>(null)

  const runTest = async () => {
    setStatus('loading')
    setMessage('Testando conexão...')
    setDetails(null)

    // Verificar configuração
    if (!isSupabaseConfigured()) {
      setStatus('error')
      setMessage('Supabase não está configurado!')
      setDetails({
        error: 'Variáveis de ambiente não encontradas',
        solution: 'Verifique o arquivo .env.local'
      })
      return
    }

    // Testar conexão
    const result = await testSupabaseConnection()

    if (result.success) {
      setStatus('success')
      setMessage(result.message || 'Conexão estabelecida com sucesso!')

      // Tentar listar colaboradores
      try {
        const { data, error, count } = await supabase!
          .from('employees')
          .select('*', { count: 'exact' })

        if (!error) {
          setDetails({
            tableExists: true,
            employeeCount: count || 0,
            employees: data || []
          })
        }
      } catch (e) {
        console.error('Erro ao buscar colaboradores:', e)
      }
    } else {
      setStatus('error')
      setMessage(result.error || 'Erro na conexão')
      setDetails({
        error: result.error,
        hint: result.error?.includes('does not exist')
          ? 'Execute o SQL em scripts/create-employees-table.sql no Supabase'
          : 'Verifique as credenciais no arquivo .env.local'
      })
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              Teste de Conexão Supabase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status da Conexão */}
            <Alert className={
              status === 'success' ? 'border-green-500 bg-green-50' :
              status === 'error' ? 'border-red-500 bg-red-50' :
              status === 'loading' ? 'border-blue-500 bg-blue-50' :
              ''
            }>
              <div className="flex items-center gap-3">
                {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                {status === 'idle' && <Database className="w-5 h-5 text-gray-600" />}
                <AlertDescription className="text-base font-medium">
                  {message}
                </AlertDescription>
              </div>
            </Alert>

            {/* Detalhes */}
            {details && (
              <div className="space-y-3">
                {details.tableExists && (
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-semibold mb-2">Informações do Banco:</h3>
                    <ul className="space-y-1 text-sm">
                      <li>✅ Tabela "employees" existe</li>
                      <li>📊 Total de colaboradores: {details.employeeCount}</li>
                      <li>🔗 URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</li>
                    </ul>
                  </div>
                )}

                {details.error && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold mb-2 text-red-800">Erro:</h3>
                    <p className="text-sm text-red-700">{details.error}</p>
                    {details.hint && (
                      <p className="text-sm text-red-600 mt-2">
                        💡 {details.hint}
                      </p>
                    )}
                  </div>
                )}

                {details.solution && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold mb-2 text-yellow-800">Solução:</h3>
                    <p className="text-sm text-yellow-700">{details.solution}</p>
                  </div>
                )}
              </div>
            )}

            {/* Informações de Configuração */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-900">Configuração Atual:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">URL:</span>{' '}
                  <code className="bg-white px-2 py-1 rounded">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Não configurado'}
                  </code>
                </div>
                <div>
                  <span className="font-medium">Anon Key:</span>{' '}
                  <code className="bg-white px-2 py-1 rounded">
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
                      '***' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-8) :
                      'Não configurado'}
                  </code>
                </div>
              </div>
            </div>

            {/* SQL para criar tabela */}
            {status === 'error' && details?.error?.includes('does not exist') && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">SQL para criar a tabela:</h3>
                <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  week_availability JSONB NOT NULL DEFAULT '{}',
  hour_availability JSONB NOT NULL DEFAULT '{}',
  custom_hourly_rate DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_employees_city ON employees(city);
CREATE INDEX idx_employees_state ON employees(state);
CREATE INDEX idx_employees_type ON employees(type);

-- RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Política de acesso
CREATE POLICY "Allow public access" ON employees
  FOR ALL USING (true) WITH CHECK (true);`}
                </pre>
                <a
                  href="https://supabase.com/dashboard/project/eijnesrqpzvjqxmqtzcz/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                >
                  🔗 Abrir SQL Editor no Supabase →
                </a>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3">
              <Button onClick={runTest} disabled={status === 'loading'}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Testar Novamente
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Voltar ao Sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}