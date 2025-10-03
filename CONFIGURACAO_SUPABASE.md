# Configuração do Supabase

## ⚠️ IMPORTANTE: Configure o Supabase

O projeto está preparado para usar o Supabase, mas precisa ser configurado:

### 1. Crie uma conta no Supabase
- Acesse https://supabase.com
- Crie um novo projeto

### 2. Obtenha as credenciais
No painel do Supabase:
- Vá em Settings > API
- Copie a **URL** do projeto
- Copie a **anon public key**

### 3. Configure o arquivo .env.local
Edite o arquivo `.env.local` e substitua com suas credenciais:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 4. Crie a tabela no banco de dados
No Supabase SQL Editor, execute o script que está em:
`scripts/create-employees-table.sql`

### 5. Reinicie o servidor
```bash
npm run dev
```

## Teste de Conexão

Para testar se está funcionando, criamos uma função helper em `lib/supabase-helpers.ts`:

```javascript
import { testSupabaseConnection } from '@/lib/supabase-helpers'

// No seu componente:
const result = await testSupabaseConnection()
if (result.success) {
  console.log('Conexão OK!')
} else {
  console.error(result.error)
}
```

## Funcionalidades

Com o Supabase configurado, o sistema poderá:
- ✅ Salvar colaboradores no banco de dados
- ✅ Sincronizar dados entre dispositivos
- ✅ Backup automático na nuvem
- ✅ Acesso de qualquer lugar

## Modo Offline

Se o Supabase não estiver configurado, o sistema funcionará normalmente usando localStorage (armazenamento local do navegador).