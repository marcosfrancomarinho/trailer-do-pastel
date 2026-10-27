# Testes

```text
test/
  unit/
    application/use-cases/  # casos de uso, agrupados por recurso
    application/services/   # montagem de itens e adicionais
    domain/entities/        # entidades
    domain/policies/        # condições para operações de negócio
    domain/value-objects/   # validações e valores
    infrastructure/         # controllers, middlewares e adaptadores com mocks
  integration/              # Prisma e PostgreSQL reais
  e2e/                      # build de produção e HTTP real
  helpers/                  # fixtures e recursos compartilhados
```

Os unitários espelham a organização de `src/`. O gerador `npm test -- <arquivo>` também cria novos testes em `test/unit/`.

| Camada | Comando | Dependências |
| --- | --- | --- |
| Unidade | `npm run test:unit` ou `npm test` | Sem banco ou servidor |
| Cobertura unitária | `npm run test:coverage` | Sem banco ou servidor |
| Integração | `npm run test:integration` | PostgreSQL real |
| Ponta a ponta (E2E) | `npm run test:e2e` | PostgreSQL real; gera e inicia o build de produção |
| Todas | `npm run test:all` | PostgreSQL real |

No PowerShell com bloqueio de scripts, utilize `npm.cmd` no lugar de `npm`.

## Banco dos testes

Configure `TEST_DATABASE_URL` para um banco PostgreSQL existente cujo usuário possa criar schemas. Se não definida, a suíte usa `DATABASE_URL`, inclusive a configuração do `.env`.

Exemplo no PowerShell:

```powershell
$env:TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/trailer_do_pastel_test?schema=public'
npm.cmd run test:all
```

O banco precisa existir. As suítes criam schemas aleatórios `test_integration_<uuid>` e `test_e2e_<uuid>`, aplicam as migrations PostgreSQL do projeto e removem seus schemas no encerramento. A limpeza entre cenários verifica o nome do schema antes de excluir registros. Não há reset das tabelas da aplicação. Uma interrupção forçada do processo pode deixar um schema temporário para limpeza posterior.

Sem PostgreSQL acessível, integração e E2E falham explicitamente; não são marcados como ignorados. A suíte unitária continua funcionando sem banco. Execute os comandos de teste sequencialmente, pois o compilador compartilha seu diretório de cache.

## O que cada camada verifica

- **Unidade:** use cases, serviços, entidades, objetos de valor, controllers e adaptadores com dependências simuladas; validações e propagação de erros.
- **Integração:** use cases com repositórios Prisma e PostgreSQL reais; migrations, precisão decimal, filtros de data, restrições de chave estrangeira, fechamento e arquivamento de mesas, concorrência e rollback de transações. As asserções conferem o estado persistido após sucesso e falha.
- **E2E:** inicia `dist/bundle.cjs` em processo separado e porta temporária, com a composição de dependências de produção. Usa HTTP real, bcrypt, JWT e PostgreSQL, sem mocks. Exercita login, permissões, revogação de acesso, catálogo, pedidos online, rastreamento, pedidos de mesa, identificação do funcionário, comandas, cancelamentos e funcionamento da loja. Apenas a conta inicial de administrador é criada diretamente no banco; o restante da preparação usa a API.

O projeto é uma API, portanto os E2E cobrem fluxos HTTP completos. Não há interface web para automatizar com navegador.

O CI executa a suíte unitária nos três sistemas operacionais e as suítes de integração e E2E em um job Linux com PostgreSQL 18.
