# 🗄️ Instruções de Configuração do Supabase

## 📋 Passo a Passo Completo

### 1️⃣ Acessar o Supabase
1. Acesse https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione o projeto: **srwbtxvcyvdbcfgrdxen**

---

### 2️⃣ Executar Scripts SQL

#### Opção A: Script Completo (RECOMENDADO)
1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo:
   ```
   scripts/setup-supabase-complete.sql
   ```
4. Clique em **RUN** ou pressione `Ctrl + Enter`
5. ✅ Aguarde a mensagem de sucesso

#### Opção B: Scripts Individuais
Se preferir executar separadamente:

**Primeiro:** Tabela de Colaboradores
```bash
scripts/create-employees-table.sql
```

**Depois:** Tabela de Escalas
```bash
scripts/create-schedules-table.sql
```

---

### 3️⃣ Verificar se Funcionou

Execute este comando no SQL Editor:
```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Deve mostrar:
-- employees
-- schedules
```

---

### 4️⃣ Testar Conexão na Aplicação

#### Método 1: Pela Interface
1. Execute a aplicação: `npm run dev`
2. Abra http://localhost:3000
3. Verifique o ícone de conexão:
   - 🔵 **Cloud** (conectado) = ✅ Funcionando
   - 🔴 **CloudOff** (desconectado) = ❌ Problema

#### Método 2: Via Script de Teste
```bash
node test-supabase.js
```

---

## 🔑 Credenciais Configuradas

Suas credenciais já estão no arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://srwbtxvcyvdbcfgrdxen.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

✅ **Não precisa alterar nada!**

---

## 📊 Estrutura das Tabelas Criadas

### Tabela `employees`
Armazena informações dos colaboradores:
- ✅ Dados pessoais (nome, email, telefone)
- ✅ Tipo de colaborador (novato, team leader, etc.)
- ✅ Estado (ativo, inativo, só se necessário)
- ✅ Disponibilidade semanal e horária
- ✅ Taxa horária customizada
- ✅ Documentos (CC, carta de condução, contrato)

### Tabela `schedules`
Armazena as escalas de trabalho:
- ✅ Cidade e data
- ✅ Colaborador associado
- ✅ Slots de tempo (48 blocos de 30 min = 24h)
- ✅ Total de horas e custos calculados
- ✅ Ordem de exibição

---

## 🚀 Funcionalidades Habilitadas

Após configurar o Supabase:

### ✅ Sincronização em Nuvem
- Dados salvos automaticamente
- Acesso de qualquer dispositivo
- Backup automático

### ✅ Botões Funcionais
- **Sincronizar**: Envia dados locais para nuvem
- **Carregar**: Baixa dados da nuvem
- Indicador de status de conexão

### ✅ Colaboração
- Múltiplos usuários podem acessar os mesmos dados
- Atualizações em tempo real (se configurar Real-time)

---

## 🔒 Segurança

### ⚠️ IMPORTANTE: Políticas RLS
As tabelas estão configuradas com acesso público para desenvolvimento.

**Para produção**, altere as políticas no SQL Editor:

```sql
-- Remover acesso público
DROP POLICY "Allow public access to employees" ON employees;
DROP POLICY "Allow public access to schedules" ON schedules;

-- Criar política baseada em autenticação
CREATE POLICY "Authenticated users only" ON employees
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users only" ON schedules
  FOR ALL
  USING (auth.role() = 'authenticated');
```

---

## 🐛 Resolução de Problemas

### Problema: "Supabase não configurado"
✅ Verifique se o arquivo `.env.local` existe
✅ Reinicie o servidor: `npm run dev`

### Problema: "Erro ao sincronizar"
✅ Confirme que executou os scripts SQL
✅ Verifique as tabelas no Supabase Dashboard > Table Editor

### Problema: "Failed to fetch"
✅ Verifique sua conexão com internet
✅ Confirme que o projeto Supabase está ativo

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Consulte os logs do Supabase: Dashboard > Logs
3. Revise as políticas RLS: Dashboard > Authentication > Policies

---

## ✅ Checklist Final

- [ ] Scripts SQL executados com sucesso
- [ ] Tabelas `employees` e `schedules` criadas
- [ ] Aplicação mostra ícone "Conectado"
- [ ] Botão "Sincronizar" funciona
- [ ] Botão "Carregar" funciona
- [ ] Dados aparecem no Table Editor do Supabase

🎉 **Tudo pronto! Seu sistema está configurado!**
