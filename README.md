# Pulso Social — scaffold de publicação

Painel Next.js em português, modelo PostgreSQL, filas BullMQ separadas, worker isolado e uma interface demonstrativa para organizar publicações. **Esta entrega é um scaffold e uma demonstração visual, não um SaaS operacional ligado ao Instagram.** O adaptador real, autenticação do SaaS, upload S3, controle de organização em todas as rotas e intervenção humana ainda precisam ser implementados e validados antes de qualquer uso real.

## O que está funcionando nesta entrega

- Painel responsivo com dashboard, contas de exemplo, biblioteca, agendamentos, histórico, central de verificações e configurações.
- Fluxo visual de composição de imagem, carrossel ou Reel, legenda, seleção de contas e agendamento. A confirmação é explicitamente demonstrativa e não envia dados.
- Dashboard usa conteúdo estático identificado como demonstração. Métricas de visualização não são métricas do Instagram.
- Schema PostgreSQL inicial para organização, associação de usuários, contas, grupos, mídias, lotes, publicações por conta, tentativas, intervenções, snapshots e auditoria.
- Filas BullMQ separadas para publicação e métricas, chave interna estável, cancelamento de tarefas pendentes e lease Redis por conta com renovação.
- Utilitário AES-256-GCM para criptografar segredos. A aplicação ainda não persiste credenciais ou sessões.
- Regras testadas para contagem exclusiva de publicações, métricas parciais, correções de contador, isolamento por organização, lease, idempotência e decisão de recuperação.
- Serviço de sessão privado desligado, exposto apenas no loopback do host; o endpoint informa que intervenção real ainda não está habilitada.

## Rodar localmente

Requer Docker Compose e Node.js 22 ou superior.

```bash
cp .env.example .env
# Troque APP_ENCRYPTION_KEY e SESSION_ENCRYPTION_KEY por chaves aleatórias de 32 bytes em Base64.
openssl rand -base64 32
docker compose up --build
```

Abra `http://localhost:3000`. Para rodar os testes e a simulação:

```bash
npm ci
npm test
npm run typecheck
npm run simulate:500
```

`simulate:500` apenas cria estruturas em memória e chaves idempotentes. Não inicia navegadores, não mede consumo do Chromium, não contata contas e não valida capacidade de publicar.

O serviço PostgreSQL carrega `db/init.sql` na primeira inicialização do volume. Para reaplicar alterações estruturais em ambiente descartável, remova o volume local `postgres_data` com `docker compose down -v` antes de subir novamente. Não use essa opção para volumes com dados que queira preservar.

## Serviços

| Serviço | Responsabilidade | Estado desta entrega |
| --- | --- | --- |
| `web` | Painel Next.js e API | Dashboard demonstrativo; sem autenticação ou operações persistentes |
| `worker` | BullMQ e execução isolada | Filas e bloqueio Redis disponíveis; adaptador real desligado |
| `session` | Sessão de navegador e intervenção | Shell de saúde apenas; não inicia sessão nem transmite navegador |
| `postgres` | Persistência | Schema inicial implementado; aplicação não está conectada às tabelas |
| `redis` | Filas e leases | Conexão configurada para workers |
| `minio` | S3 local para mídias | Serviço disponível; bucket, upload e URLs assinadas ainda não integrados |

## Decisões e limites

- O modo padrão é `DEMO_MODE=true`. O painel, as contas, os resultados e os números são dados ilustrativos. Nunca devem ser interpretados como publicações ou leituras reais.
- Definir `DEMO_MODE=false` **não habilita publicação**: seleciona um adaptador que lança erro explícito por não estar implementado. Não altere para produção esperando publicar.
- Nenhuma API Meta é chamada. Não existe nesta entrega fluxo de login por usuário/senha, persistência de sessão, interface de desafio 2FA/CAPTCHA, upload S3, worker Playwright funcional, extração de métricas da interface, autenticação do produto nem autorização multi-organização de ponta a ponta.
- A chave idempotente e o `jobId` evitam criar duas tarefas internas para a mesma combinação; não garantem execução única no Instagram.
- Uma publicação cuja confirmação se perde depois do envio deve ser marcada como resultado incerto e reconciliada; não se deve reenviar sem confirmação.
- A fila de métricas é separada e tem prioridade menor, mas a concorrência por organização e a coordenação real com estado persistente ainda não estão completas.
- Frequência de métricas no `.env.example` é uma configuração futura. Os dados atuais não são coletados periodicamente.
- Stories não fazem parte do escopo. Recursos e restrições da interface mudam; tipos, duração, proporções, resultados e métricas precisam ser observados e testados com poucas contas autorizadas antes de declarar suporte.
- O schema contempla auditoria, mas ainda não há rota autenticada para registrar eventos. Capturas e credenciais não são coletadas.

## Próximos gates para uso real

1. Implementar autenticação do SaaS, membership e verificação de organização em toda leitura, escrita, URL temporária e tarefa.
2. Integrar armazenamento S3 com validação de mídia e links temporários.
3. Implementar publicação e leitura de métricas no adaptador Playwright com seletores semânticos, sessão isolada por conta, sem bypass de CAPTCHA/bloqueios e com confirmação observável.
4. Completar intervenção humana protegida, controles de acesso e expiração de sessões/capturas.
5. Persistir transições e tentativas em Postgres; integrar filas às tabelas, cancelamento, pausa de lote, limites globais e por organização, retomada e estado incerto.
6. Validar fluxo ponta a ponta com poucas contas autorizadas, revisar regras aplicáveis do Instagram e medir memória/CPU/duração com Chromium antes de aumentar concorrência.
7. Depois disso, executar teste progressivo de capacidade; a simulação local de 500 tarefas não é teste de capacidade do navegador nem da plataforma.

## Dependências

Dependências JavaScript estão fixadas em `package.json` e lockfile. O projeto usa Next.js 16.3.7, React 19.2.4, BullMQ 5.58.5, Playwright 1.56.1 e PostgreSQL 17.6 para desenvolvimento. Imagens de contêiner estão declaradas no Compose.
