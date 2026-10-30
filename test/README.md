# Testes

Os testes disponíveis estão em `test/unit/` e usam o executor do Node.js. Eles cobrem casos de uso, entidades, objetos de valor, controllers e adaptadores com dependências simuladas. Não precisam de banco de dados nem de servidor em execução.

| Comando | Resultado |
| --- | --- |
| `npm test` ou `npm run test:unit` | Executa os testes unitários |
| `npm run test:coverage` | Executa os testes unitários com cobertura |
| `npm run test:all` | Executa os testes unitários (equivalente a `test:unit`) |

O projeto ainda não tem suítes de integração ou E2E. No PowerShell com bloqueio de scripts, use `npm.cmd` no lugar de `npm`.
