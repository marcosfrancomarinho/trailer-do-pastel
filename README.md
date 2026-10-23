# Trailer do Pastel

[![CI](https://github.com/marcosfrancomarinho/trailer-do-pastel/actions/workflows/ci.yml/badge.svg)](https://github.com/marcosfrancomarinho/trailer-do-pastel/actions/workflows/ci.yml)

API para cadastrar usuários, categorias, produtos, adicionais e pedidos de uma pastelaria.

O cliente pode fazer um pedido sem criar uma conta. A API consulta os produtos e adicionais para verificar disponibilidade e registra no pedido o nome e os preços do catálogo naquele momento.

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
touch prisma/database.sqlite
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

Preencha `JWT_SECRET` com uma chave aleatória de pelo menos 32 bytes em cada ambiente. A API exige essa chave para iniciar e os tokens de login expiram em uma hora.

O primeiro usuário deve existir no banco antes de usar o login. O cadastro de novos usuários pela API exige o token de um usuário já autenticado.

## Rotas

As rotas `POST` de cadastro recebem JSON e retornam `201 Created` em caso de sucesso. Login e listagens retornam `200 OK`.

| Método | Rota | Operação | Resposta |
| --- | --- | --- | --- |
| POST | `/users` | Usuário | `{ "id": "..." }` |
| POST | `/login` | Login de usuário | `{ "name": "marcos", "accessToken": "..." }` |
| POST | `/categories` | Categoria | `{ "id": "..." }` |
| PATCH | `/categories/:categoryId` | Atualizar categoria | `{ "id": "..." }` |
| DELETE | `/categories/:categoryId` | Excluir categoria | `204 No Content` |
| GET | `/categories` | Listar categorias | `[{ "id": "...", "name": "Pastéis" }]` |
| GET | `/categories/:categoryId/products` | Listar produtos da categoria | `[{ "id": "...", "name": "Pastel de queijo", "description": "...", "categoryId": "...", "price": "12.5", "available": true }]` |
| GET | `/products` | Listar todos os produtos | `[{ "id": "...", "name": "Pastel de queijo", "description": "...", "categoryId": "...", "price": "12.5", "available": true }]` |
| POST | `/products` | Produto | `{ "id": "..." }` |
| PATCH | `/products/:productId` | Atualizar produto | `{ "id": "..." }` |
| DELETE | `/products/:productId` | Excluir produto | `204 No Content` |
| POST | `/additions` | Cadastrar adicional | `{ "id": "..." }` |
| PATCH | `/additions/:additionId` | Atualizar adicional | `{ "id": "..." }` |
| DELETE | `/additions/:additionId` | Excluir adicional | `204 No Content` |
| GET | `/additions` | Listar todos os adicionais | `[{ "id": "...", "name": "Queijo extra", "price": "2.5", "available": true }]` |
| GET | `/products/:productId/additions` | Listar adicionais do produto | `[{ "id": "...", "name": "Queijo extra", "price": "2.5", "available": true }]` |
| POST | `/orders` | Pedido | `{ "id": "...", "trackingToken": "...", "status": "PENDING", "total": "30" }` |
| GET | `/orders/tracking/:trackingToken` | Acompanhar pedido | `{ "status": "PREPARING", "updatedAt": "..." }` |
| PATCH | `/orders/:orderId/status` | Atualizar status do pedido | `{ "status": "COMPLETED", "id": "..." }` |
| GET | `/orders/pending` | Listar pedidos pendentes | `[{ "id": "...", "customerName": "Maria Silva", "customerPhone": "...", "status": "PENDING", "total": "30", "createdAt": "...", "items": [...] }]` |
| GET | `/orders/preparing` | Listar pedidos confirmados e em preparo | `[{ "id": "...", "status": "CONFIRMED", "total": "30", "createdAt": "...", "updatedAt": "...", "items": [...] }]` |
| GET | `/orders/history` | Histórico administrativo de pedidos concluídos e cancelados | `[{ "id": "...", "status": "COMPLETED", "total": "30", "createdAt": "...", "updatedAt": "...", "items": [...], "histories": [...] }]` |

O cadastro de usuários e as rotas de cadastro, atualização e exclusão de categorias, produtos e adicionais exigem `Authorization: Bearer <accessToken>`. Também exigem token `GET /orders/pending`, `GET /orders/preparing`, `GET /orders/history` e `PATCH /orders/:orderId/status`. Login, consultas do catálogo, criação de pedidos e acompanhamento por `trackingToken` são públicos. Um token ausente ou inválido retorna `401 UNAUTHORIZED`.

### Usuários

```json
{
  "name": "marcos",
  "password": "Pastel123!"
}
```

O nome deve ser único. A senha deve conter pelo menos 8 caracteres, letras e números, respeitando o limite de 72 bytes do bcrypt. Somente o hash é persistido, e a resposta não inclui a senha.

Para entrar, envie o mesmo `name` e `password` no JSON de `POST /login`. A resposta contém o nome cadastrado e um token JWT com o ID do usuário em `sub`. Envie esse token no cabeçalho `Authorization` das rotas protegidas. Se o usuário não existir ou a senha não conferir, a API retorna `401 INVALID_CREDENTIALS`; campos inválidos retornam `400`.

### Categorias

```json
{
  "name": "Pastéis"
}
```

O nome da categoria é obrigatório e único. Crie a categoria antes de cadastrar produtos e use o ID retornado em `categoryId`. `GET /categories` lista todas as categorias em ordem alfabética; quando não há nenhuma, retorna `[]`.

### Produtos

```json
{
  "name": "Pastel de queijo",
  "description": "Pastel recheado com queijo e orégano",
  "categoryId": "ID_DA_CATEGORIA",
  "price": "12.50",
  "available": true,
  "additionIds": ["ID_DO_ADICIONAL"]
}
```

`additionIds` é opcional: omita o campo ou envie `[]` para cadastrar um produto sem adicionais. Para um produto com adicionais, informe os IDs dos adicionais já cadastrados. A criação do produto e dos vínculos acontece na mesma operação. IDs repetidos ou inválidos retornam `400`; um adicional não encontrado retorna `404`.

Para atualizar um produto, envie `PATCH /products/:productId` com pelo menos um campo: `name`, `description`, `categoryId`, `price`, `available` ou `additionIds`. Os campos omitidos mantêm seus valores atuais. Omitir `additionIds` mantém os vínculos; enviar `[]` remove todos; enviar IDs substitui a lista. A atualização do produto e dos vínculos acontece na mesma transação. O produto, a nova categoria e os adicionais informados precisam existir. Nome duplicado retorna `409`.

### Adicionais

```json
{
  "name": "Queijo extra",
  "price": "2.50",
  "available": true
}
```

O nome e a descrição do produto são obrigatórios; a descrição não pode ser nula nem vazia. `categoryId` também é obrigatório e deve apontar para uma categoria existente. Se a categoria não existir, `POST /products` retorna `404`. Uma categoria pode ter vários produtos.

`GET /categories/:categoryId/products` lista os produtos da categoria em ordem alfabética, incluindo os indisponíveis. O preço é retornado como string decimal. Se não houver produtos para o ID informado, a resposta é `[]`.

`GET /products` lista todos os produtos em ordem alfabética, incluindo os indisponíveis. Quando não há produtos cadastrados, retorna `[]`.

`GET /additions` lista todos os adicionais em ordem alfabética, incluindo os indisponíveis. O preço é retornado como string decimal; quando não há adicionais cadastrados, a resposta é `[]`.

`GET /products/:productId/additions` lista os adicionais vinculados ao produto pela relação `product_additions`, também em ordem alfabética e incluindo os indisponíveis. Se não houver vínculos para o ID informado, retorna `[]`.

Para cadastrar um adicional, envie `POST /additions` com o nome, preço e disponibilidade no corpo JSON.

Os nomes de produtos e adicionais devem ser únicos em seus respectivos cadastros. Os preços são strings decimais e precisam ser maiores que zero. O campo `available` é opcional e assume `true` quando omitido. As datas `createdAt` são preenchidas pelo banco e não fazem parte dos payloads.

### Pedidos

Crie o produto e o adicional primeiro e use os IDs retornados:

```json
{
  "customerName": "Maria Silva",
  "customerPhone": "11999999999",
  "items": [
    {
      "productId": "ID_DO_PRODUTO",
      "quantity": 2,
      "additions": [
        {
          "additionId": "ID_DO_ADICIONAL",
          "quantity": 1
        }
      ]
    }
  ]
}
```

O pedido recebe apenas IDs e quantidades dos produtos e adicionais. A API busca o nome e os preços cadastrados e os salva no pedido, preservando os valores usados no cálculo mesmo que o catálogo mude depois. O pedido precisa ter pelo menos um item, e as quantidades devem ser inteiros positivos. Os adicionais são opcionais; quando omitidos, o controller envia um array vazio. Um mesmo adicional não pode se repetir no item: informe sua quantidade em `quantity`.

A quantidade do adicional é aplicada a cada unidade do produto:

```text
total do item = (preço do produto + soma(preço do adicional × quantidade do adicional)) × quantidade do produto
total do pedido = soma dos totais dos itens
```

No exemplo, dois pastéis de `12.50`, cada um com um adicional de `2.50`, totalizam `30`. A API calcula o total e cria o pedido com status `PENDING` e um token de acompanhamento.

O cliente pode consultar `GET /orders/tracking/:trackingToken` com o token recebido na criação. A resposta contém o status atual e `updatedAt` em UTC; um token desconhecido retorna `404 NOT_FOUND`. A resposta não contém dados pessoais do cliente e não é armazenada em cache. Para acompanhar mudanças, o cliente pode repetir a consulta.

`GET /orders/pending` retorna apenas pedidos com status `PENDING`, do mais antigo para o mais recente, ou `[]` quando não há nenhum. Cada pedido contém cliente, telefone, total, data e itens com produtos, quantidades, preços e adicionais. Os valores monetários são strings decimais. O nome do produto vem do registro salvo no pedido; o nome do adicional reflete o cadastro atual. O painel pode consultar essa rota a cada 5 segundos enquanto estiver aberto.

`GET /orders/preparing` retorna pedidos com status `CONFIRMED` ou `PREPARING`, do mais antigo para o mais recente, ou `[]` quando não há nenhum. A resposta contém os mesmos dados de cliente e itens da lista de pendentes, além de `updatedAt`. Depois de aceitar um pedido com `PATCH /orders/:orderId/status` e `{ "status": "CONFIRMED" }`, ele aparece nesta lista; ao avançar para `PREPARING`, permanece nela até ser concluído ou cancelado.

`GET /orders/history` retorna pedidos cujo status atual é `COMPLETED` ou `CANCELED`, do mais recentemente atualizado para o mais antigo, ou `[]` quando não há nenhum. A resposta inclui os mesmos dados de cliente e itens da listagem de pendentes, além de `updatedAt` e `histories`, uma lista cronológica de `{ "status": "...", "changedAt": "..." }`. As datas são UTC. O histórico registra os status pelos quais o pedido passou; não inclui o usuário responsável pela mudança.

Para atualizar o status, envie `PATCH /orders/:orderId/status` com `{ "status": "COMPLETED" }` e o token de acesso. Os valores aceitos são `PENDING`, `CONFIRMED`, `PREPARING`, `COMPLETED` e `CANCELED`. Marcar como `COMPLETED` indica que o pedido está pronto e encerra o fluxo; ele passa a aparecer em `GET /orders/history`. A atualização também cria um registro no histórico do pedido. Pedidos que deixam de estar pendentes não aparecem em `GET /orders/pending`.

## Testar as requisições

O arquivo [api.http](api.http) contém exemplos das rotas de cadastro e consulta, pedidos com e sem adicionais e respostas de erro.

Com a API rodando e as migrations aplicadas, abra o arquivo em um cliente compatível com REST Client. Configure o nome e a senha do usuário existente, execute `loginUsuario` e depois as requisições protegidas. Crie categoria, produto e adicional antes dos pedidos: os exemplos reutilizam os IDs das respostas. Altere `testId` ao repetir os cadastros para evitar nomes duplicados.

## Erros

Os controllers encaminham os erros para o middleware `ErrorHandler`.

| Status | Situação |
| --- | --- |
| 400 | Erro de validação do domínio |
| 401 | Nome ou senha incorretos no login |
| 404 | Produto ou adicional não encontrado |
| 409 | Nome já cadastrado ou item indisponível |
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

O Prisma Client e gerado em cada ambiente. A CI usa uma URL PostgreSQL de exemplo; os testes unitarios usam mocks e dispensam conexao com o banco.

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
