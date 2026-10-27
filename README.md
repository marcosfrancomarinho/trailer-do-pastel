# Trailer do Pastel

[![CI](https://github.com/marcosfrancomarinho/trailer-do-pastel/actions/workflows/ci.yml/badge.svg)](https://github.com/marcosfrancomarinho/trailer-do-pastel/actions/workflows/ci.yml)

API para cadastrar usuários, categorias, produtos, adicionais, mesas e pedidos de uma pastelaria.

O cliente pode fazer um pedido sem criar uma conta. A API verifica a disponibilidade dos produtos e adicionais e registra o nome do produto e os preços usados no cálculo.

## Tecnologias

- Node.js 22 ou superior e TypeScript.
- Express 5 e CORS.
- Prisma 6 com PostgreSQL e migrations versionadas.
- bcrypt para hash de senhas e comparação de credenciais.
- JSON Web Token (JWT) para o login de usuários.
- Decimal.js, encapsulado no VO `DecimalValue`, para cálculos monetários.
- Kit Dev para desenvolvimento, build, testes e injeção de dependências.

## Executar localmente

Requisitos: Node.js 22+, Yarn 1 e PostgreSQL. Crie o banco `trailer_do_pastel` e ajuste `DATABASE_URL` com suas credenciais.

```bash
git clone https://github.com/marcosfrancomarinho/trailer-do-pastel.git
cd trailer-do-pastel
cp postgresql.env.example .env
# Preencha JWT_SECRET no arquivo .env com uma chave aleatória; por exemplo, gere uma com: openssl rand -hex 32
yarn install --frozen-lockfile
yarn prisma generate
yarn prisma migrate deploy
yarn dev
```

A API inicia em `http://localhost:3000` e informa o endereço no terminal. Para usar outra porta:

```bash
PORT=3001 yarn dev
```

Para reiniciar automaticamente ao alterar arquivos:

```bash
yarn dev --watch
```

## Configuração do banco

O arquivo `postgresql.env.example` fornece a URL PostgreSQL e a chave para os tokens de login:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trailer_do_pastel?schema=public"
JWT_SECRET=
```

Crie o banco antes das migrations: `createdb -U postgres trailer_do_pastel`. As migrations PostgreSQL ficam em `prisma/migrations-postgresql`. O arquivo SQLite e suas migrations foram preservados. Os dados existentes precisam ser transferidos separadamente: `migrate deploy` cria a estrutura e nao copia dados.

Preencha `JWT_SECRET` com uma chave aleatória de pelo menos 32 bytes em cada ambiente. A API exige essa chave para iniciar. Novos tokens de login não têm prazo de expiração; tokens emitidos antes dessa mudança conservam sua expiração original.

O administrador é a única conta criada manualmente no banco; veja as instruções em **Primeiro administrador**. Depois disso, ele cadastra funcionários pela API.

## Guia da API

A URL base local é `http://localhost:3000`. Envie corpos em JSON com `Content-Type: application/json`. Nas rotas protegidas, envie `Authorization: Bearer <accessToken>`; obtenha o token em `POST /login`. `ADMIN` pode usar todas as rotas protegidas. `EMPLOYEE` pode usar as rotas marcadas **Equipe**. Rotas marcadas **Pública** dispensam login.

Nos caminhos, `:userId`, `:productId` etc. são parâmetros: substitua-os pelo ID real, sem os dois-pontos. Valores monetários de entrada e saída são **strings decimais**, como `"12.50"`. Datas de resposta usam ISO 8601 em UTC. Listagens que retornam arrays usam `[]` quando vazias; nas consultas de comandas, o array vazio fica dentro de `orders`, `sessions` ou `comandas`.

### Usuários e login

| Método e rota | Acesso | O que faz | Entrada | Saída de sucesso |
| --- | --- | --- | --- | --- |
| `POST /login` | Pública | Autentica um usuário. | JSON `{ "name": "Ana", "password": "Senha123" }` | `200` `{ "name": "Ana", "role": "ADMIN", "accessToken": "..." }` |
| `POST /users` | ADMIN | Cadastra um funcionário. | JSON `{ "name": "João", "password": "Senha123" }` | `201` `{ "id": "..." }` |
| `GET /users` | ADMIN | Lista usuários por nome. | Sem corpo. | `200` `[{ "id": "...", "name": "Ana", "role": "ADMIN", "createdAt": "..." }]` |
| `DELETE /users/:userId` | ADMIN | Exclui outro usuário. | ID no caminho; sem corpo. | `204`, sem corpo. |

O cadastro pela API sempre cria `EMPLOYEE`. O nome deve ser único. A senha precisa ter pelo menos 8 caracteres, letras e números, e respeitar o limite de 72 bytes do bcrypt. A resposta nunca inclui senha ou hash. Um administrador não pode excluir a própria conta.

#### Primeiro administrador

Depois das migrations, crie o administrador diretamente no PostgreSQL. Gere um hash bcrypt de custo 12 sem colocar a senha no histórico do terminal:

```bash
read -r -s -p 'Senha do administrador: ' admin_password
printf '\n'
printf '%s' "$admin_password" | node -e 'const bcrypt = require("bcrypt"); let password = ""; process.stdin.on("data", chunk => password += chunk); process.stdin.on("end", async () => console.log(await bcrypt.hash(password, 12)));'
unset admin_password
```

Copie o hash e substitua os valores neste SQL:

```sql
INSERT INTO users (id, name, password, role)
VALUES (gen_random_uuid()::text, 'seu_admin', '<HASH_BCRYPT>', 'ADMIN');
```

Se já há um usuário que deve ser administrador, promova-o em vez de criar outro:

```sql
UPDATE users SET role = 'ADMIN' WHERE name = 'seu_usuario_existente';
```

O banco aceita apenas um `ADMIN`. Não salve senha em texto puro na coluna `password`.

### Funcionamento da loja

| Método e rota | Acesso | O que faz | Entrada | Saída de sucesso |
| --- | --- | --- | --- | --- |
| `GET /store/status` | Pública | Consulta se a loja aceita pedidos. | Sem corpo. | `200` `{ "status": "OPEN", "updatedAt": "..." }` |
| `POST /store/open` | ADMIN | Abre a loja para novos pedidos. | Sem corpo. | `200` `{ "status": "OPEN", "updatedAt": "..." }` |
| `POST /store/close` | ADMIN | Fecha a loja para novos pedidos. | Sem corpo. | `200` `{ "status": "CLOSED", "updatedAt": "..." }` |

`status` vale `OPEN` ou `CLOSED`. Com a loja fechada, `POST /orders` retorna `409 UNAVAILABLE`; consultas e tratamento dos pedidos existentes continuam disponíveis.

### Categorias

| Método e rota | Acesso | O que faz | Entrada | Saída de sucesso |
| --- | --- | --- | --- | --- |
| `POST /categories` | ADMIN | Cadastra uma categoria. | JSON `{ "name": "Pastéis" }` | `201` `{ "id": "..." }` |
| `GET /categories` | Pública | Lista categorias por nome. | Sem corpo. | `200` `[{ "id": "...", "name": "Pastéis" }]` |
| `PATCH /categories/:categoryId` | ADMIN | Renomeia a categoria. | ID no caminho; JSON `{ "name": "Salgados" }` | `200` `{ "id": "..." }` |
| `DELETE /categories/:categoryId` | ADMIN | Exclui a categoria. | ID no caminho; sem corpo. | `204`, sem corpo. |
| `GET /categories/:categoryId/products` | Pública | Lista produtos da categoria, inclusive indisponíveis. | ID da categoria no caminho; sem corpo. | `200` `Produto[]`, definido abaixo. |

O nome da categoria é obrigatório e único. Crie a categoria antes de cadastrar produtos.

### Produtos e adicionais

| Método e rota | Acesso | O que faz | Entrada | Saída de sucesso |
| --- | --- | --- | --- | --- |
| `POST /products` | ADMIN | Cadastra produto e seus vínculos com adicionais. | JSON `ProdutoEntrada`, definido abaixo. | `201` `{ "id": "..." }` |
| `GET /products` | Pública | Lista todos os produtos por nome, inclusive indisponíveis. | Sem corpo. | `200` `Produto[]`. |
| `PATCH /products/:productId` | ADMIN | Altera os campos informados do produto. | ID no caminho; JSON com ao menos um campo de `ProdutoEntrada`. | `200` `{ "id": "..." }` |
| `DELETE /products/:productId` | ADMIN | Exclui um produto. | ID no caminho; sem corpo. | `204`, sem corpo. |
| `POST /additions` | ADMIN | Cadastra um adicional. | JSON `{ "name": "Queijo extra", "price": "2.50", "available": true }` | `201` `{ "id": "..." }` |
| `GET /additions` | Pública | Lista todos os adicionais por nome, inclusive indisponíveis. | Sem corpo. | `200` `Adicional[]`. |
| `PATCH /additions/:additionId` | ADMIN | Altera nome, preço e/ou disponibilidade. | ID no caminho; JSON com ao menos um de `name`, `price`, `available`. | `200` `{ "id": "..." }` |
| `DELETE /additions/:additionId` | ADMIN | Exclui um adicional. | ID no caminho; sem corpo. | `204`, sem corpo. |
| `GET /products/:productId/additions` | Pública | Lista adicionais vinculados ao produto. | ID do produto no caminho; sem corpo. | `200` `Adicional[]`. |

`ProdutoEntrada` na criação:

```json
{
  "name": "Pastel de queijo",
  "description": "Pastel recheado com queijo",
  "categoryId": "ID_DA_CATEGORIA",
  "price": "12.50",
  "imageUrl": null,
  "available": true,
  "additionIds": ["ID_DO_ADICIONAL"]
}
```

`name`, `description`, `categoryId` e `price` são obrigatórios na criação. `imageUrl`, `available` e `additionIds` são opcionais; `available` assume `true`. No `PATCH`, envie só os campos a alterar. Omitir `additionIds` mantém os vínculos, `[]` remove todos e uma lista de IDs substitui os vínculos. Nomes de produtos e adicionais devem ser únicos e os preços maiores que zero.

Um `Produto` retornado nas duas listagens contém `{ id, name, description, categoryId, price, imageUrl, available }`; `imageUrl` pode ser `null`. Um `Adicional` contém `{ id, name, price, available }`.

### Mesas e comandas

| Método e rota | Acesso | O que faz | Entrada | Saída de sucesso |
| --- | --- | --- | --- | --- |
| `POST /tables` | Equipe | Cadastra uma mesa. | JSON `{ "number": 12, "status": "FREE" }` | `201` `{ "id": "...", "status": "FREE", "totalSpent": "0" }` |
| `GET /tables` | Equipe | Lista mesas ativas por número. | Sem corpo. | `200` `[{ "id": "...", "number": 12, "status": "FREE", "totalSpent": "0" }]` |
| `DELETE /tables/:tableId` | Equipe | Retira uma mesa livre de uso. | ID da mesa no caminho; sem corpo. | `204`, sem corpo. |
| `GET /tables/:tableId/orders` | Equipe | Mostra pedidos da comanda aberta e o total atual. | ID da mesa no caminho; sem corpo. | `200` `{ "tableId": "...", "number": 12, "status": "OCCUPIED", "totalSpent": "30", "sessionId": "...", "orders": [PedidoDaComanda] }`. |
| `GET /tables/:tableId/sessions` | Equipe | Lista comandas da mesa, da mais recente à mais antiga. | ID da mesa no caminho; sem corpo. | `200` `{ "tableId": "...", "sessions": [Comanda] }`. |
| `GET /tables/sessions/history` | ADMIN | Lista comandas fechadas e pedidos online finalizados em um dia. | Query obrigatória `?date=2026-10-24`; sem corpo. | `200` `{ "comandas": [{ "tableId": "...", "tableNumber": 12, "origin": "TABLE", "session": Comanda }] }`. |
| `DELETE /tables/:tableId/orders/:orderId` | Equipe | Cancela e desvincula um pedido ativo da mesa; desconta seu valor. | IDs da mesa e do pedido no caminho; sem corpo. | `200` `{ "orderId": "...", "tableId": null, "status": "CANCELED", "totalSpent": "15" }`. |
| `PATCH /tables/:tableId/release` | Equipe | Fecha a comanda e libera a mesa. | ID da mesa no caminho; sem corpo. | `200` `{ "id": "...", "status": "FREE", "totalSpent": "0", "sessionId": "...", "closedTotal": "30" }`. |

`number` deve ser inteiro positivo e único entre mesas ativas. `status` aceita `FREE` ou `OCCUPIED` e assume `FREE` na criação. Uma mesa criada como `OCCUPIED` recebe uma comanda vazia. Um pedido com `tableId` ocupa a mesa, abre uma comanda se necessário e soma seu valor a `totalSpent`. A mesa livre devolve `sessionId: null` e `orders: []` na consulta da comanda aberta.

`PedidoDaComanda` contém `{ id, customerName, createdBy, customerPhone, observation, tableId, status, total, createdAt, updatedAt, items }`. `createdBy` é `{ name, role }` ou `null`; `items` tem a estrutura descrita em **Pedidos**. `Comanda` contém `{ id, openedAt, closedAt, closedTotal, orders: PedidoDaComanda[] }`. Na comanda aberta, `closedAt` e `closedTotal` são `null`. As comandas fechadas preservam pedidos cancelados. No histórico geral, `origin` é `TABLE` ou `ONLINE`; para pedidos online, `tableId` e `tableNumber` são `null`.

A remoção aceita pedidos `PENDING`, `CONFIRMED` ou `PREPARING` e preserva o registro na comanda de origem. Para liberar uma mesa, todos os pedidos ainda vinculados a ela precisam estar `COMPLETED` ou `CANCELED`; a operação grava `closedTotal` e zera `totalSpent`. Uma mesa ocupada não pode ser excluída. O filtro `date` do histórico é uma data válida em `AAAA-MM-DD`, no dia local de Imperatriz (UTC−03:00).

### Pedidos

| Método e rota | Acesso | O que faz | Entrada | Saída de sucesso |
| --- | --- | --- | --- | --- |
| `POST /orders` | Pública sem mesa; Equipe com `tableId` | Cria um pedido e calcula o total a partir do catálogo. | JSON `PedidoEntrada`, definido abaixo. | `201` `{ "id": "...", "trackingToken": "...", "status": "PENDING", "total": "30", "tableId": null }`. |
| `GET /orders/tracking/:trackingToken` | Pública | Consulta o estado de um pedido pelo token de acompanhamento. | Token no caminho; sem corpo. | `200` `{ "status": "PREPARING", "updatedAt": "..." }`. |
| `PATCH /orders/:orderId/status` | Equipe | Muda o status e registra a mudança no histórico. | ID do pedido no caminho; JSON `{ "status": "CONFIRMED" }`. | `200` `{ "id": "...", "status": "CONFIRMED" }`. |
| `GET /orders/pending` | Equipe | Lista pedidos `PENDING`, do mais antigo ao mais novo. | Query opcional `?date=2026-10-24`; sem corpo. | `200` `PedidoResumo[]`. |
| `GET /orders/preparing` | Equipe | Lista pedidos `CONFIRMED` ou `PREPARING`. | Query opcional `?date=2026-10-24`; sem corpo. | `200` `PedidoResumo[]` com `updatedAt`. |
| `GET /orders/history` | Equipe | Lista pedidos `COMPLETED` ou `CANCELED`, do mais recente ao mais antigo. | Query opcional `?date=2026-10-24`; sem corpo. | `200` `PedidoResumo[]` com `updatedAt` e `histories`. |

`PedidoEntrada` completo para dois pastéis com um adicional por pastel:

```json
{
  "customerName": "Maria Silva",
  "customerPhone": "11999999999",
  "observation": "Sem cebola",
  "tableId": null,
  "items": [
    {
      "productId": "ID_DO_PRODUTO",
      "quantity": 2,
      "additions": [{ "additionId": "ID_DO_ADICIONAL", "quantity": 1 }]
    }
  ]
}
```

`customerName`, `customerPhone` e `items` são obrigatórios; `items` precisa ter ao menos um item. Quantidades são inteiros positivos. `observation` é opcional, aceita até 500 caracteres e fica `null` quando vazia. `tableId` é opcional: omita ou envie `null` para um pedido online; informe o ID de uma mesa e o token de um usuário da equipe para atendimento presencial. `additions` pode ser omitido ou ser `[]`. O mesmo adicional não pode aparecer duas vezes em um item. A API salva o nome do produto e os preços usados no pedido, para preservar o valor cobrado mesmo se o catálogo mudar. O nome do adicional exibido nas consultas acompanha o cadastro atual.

```text
total do item = (preço do produto + soma(preço do adicional × quantidade do adicional)) × quantidade do produto
total do pedido = soma dos totais dos itens
```

`PedidoResumo` contém `{ id, customerName, customerPhone, observation, tableId, tableNumber, status, total, createdAt, items }`. `observation`, `tableId` e `tableNumber` podem ser `null`. Cada item contém `{ productId, productName, quantity, unitPrice, additions }`; cada adicional contém `{ additionId, additionName, quantity, unitPrice }`. A lista de pedidos em preparo também traz `updatedAt`; o histórico traz `updatedAt` e `histories: [{ status, changedAt }]` em ordem cronológica.

Os status possíveis são `PENDING`, `CONFIRMED`, `PREPARING`, `COMPLETED` e `CANCELED`. `COMPLETED` e `CANCELED` encerram o pedido. Cancelar um pedido da mesa desconta seu valor do total. Nas três listagens, `date` filtra pela **data de criação** do pedido, aceita `AAAA-MM-DD` e, quando omitido, usa o dia atual em Imperatriz (UTC−03:00).

## Testar as requisições

O arquivo [api.http](api.http) contém exemplos de requisições para testar a API.

Com a API rodando e as migrations aplicadas, abra o arquivo em um cliente compatível com REST Client. Configure o nome e a senha do usuário existente, execute `loginUsuario` e depois as requisições protegidas. Crie categoria e adicional, vincule o adicional ao produto e então crie os pedidos: os exemplos reutilizam os IDs das respostas. Altere `testId` ao repetir os cadastros para evitar nomes duplicados.

## Erros

Os controllers encaminham os erros para o middleware `ErrorHandler`.

| Status | Situação |
| --- | --- |
| 400 | Campo obrigatório, formato inválido ou valor fora das regras |
| 401 | Login incorreto ou token ausente, inválido ou de usuário excluído |
| 403 | Usuário autenticado sem permissão para a ação |
| 404 | Recurso informado no caminho ou no corpo não encontrado |
| 409 | Nome já cadastrado, item em uso ou operação indisponível no estado atual |
| 500 | Erro interno inesperado |

Erros de domínio e aplicação informam campo, código e mensagem:

```json
{
  "field": "name",
  "code": "ALREADY_EXISTS",
  "message": "Já existe um produto cadastrado com esse nome."
}
```

Erros inesperados retornam uma mensagem genérica, sem expor detalhes internos.

## Comandos

| Comando | Descrição |
| --- | --- |
| `yarn dev` | Executa a API em desenvolvimento |
| `yarn dev --watch` | Reinicia a API ao alterar arquivos |
| `yarn type` | Verifica os tipos TypeScript |
| `yarn test` | Executa os testes |
| `yarn test:coverage` | Executa os testes e mostra a cobertura medida pelo Node.js |
| `yarn test --watch` | Executa os testes ao alterar arquivos |
| `yarn build` | Verifica tipos e gera `dist/bundle.cjs` |
| `yarn start` | Executa o build gerado |
| `yarn prisma migrate deploy` | Aplica as migrations existentes |

Para executar o build:

```bash
yarn build
yarn start
```

## Integração contínua

O workflow [CI](.github/workflows/ci.yml) executa os testes, a verificação de tipos e o build em Linux, Windows e macOS, usando Node.js 22 e Yarn 1.22.22. Ele roda a cada push, em pull requests e também pode ser iniciado manualmente na aba Actions.

O Prisma Client é gerado em cada ambiente. A CI usa uma URL PostgreSQL de exemplo; os testes unitários usam mocks e dispensam conexão com o banco.

## Organização

```text
src/
  application/     # Casos de uso, DTOs, services e gateways
  domain/          # Entidades, VOs, erros e contratos de repositórios
  infrastructure/ # Express, controllers, middleware, Prisma e bcrypt
  di/              # Registro das dependências
  main.ts          # Inicialização da aplicação
prisma/            # Schema e migrations do banco
test/              # Testes unitários
kit-dev/           # Ferramentas de desenvolvimento, testes e DI
api.http           # Exemplos de requisições
```

Os casos de uso expõem métodos curtos conforme a operação, como `create()`, `list()` e `login()`. A montagem dos itens e adicionais do pedido fica nos services de aplicação, e as regras de negócio são validadas nas entidades e nos VOs.
