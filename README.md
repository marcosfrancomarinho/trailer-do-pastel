# Trailer do Pastel

[![CI](https://github.com/marcosfrancomarinho/trailer-do-pastel/actions/workflows/ci.yml/badge.svg)](https://github.com/marcosfrancomarinho/trailer-do-pastel/actions/workflows/ci.yml)

API para cadastrar usuários, categorias, produtos, adicionais e pedidos de uma pastelaria.

O cliente pode fazer um pedido sem criar uma conta. A API consulta os produtos e adicionais para verificar disponibilidade e registra no pedido o nome e os preços do catálogo naquele momento.

## Tecnologias

- Node.js 22 ou superior e TypeScript.
- Express 5 e CORS.
- Prisma 6 com SQLite e migrations versionadas.
- bcrypt para hash de senhas e comparação de credenciais.
- JSON Web Token (JWT) para o login de usuários.
- Decimal.js, encapsulado no VO `DecimalValue`, para cálculos monetários.
- Kit Dev para desenvolvimento, build, testes e injeção de dependências.

## Executar localmente

É necessário ter Node.js 22+ e Yarn 1 instalados.

```bash
git clone https://github.com/marcosfrancomarinho/trailer-do-pastel.git
cd trailer-do-pastel
cp .env.example .env
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

O arquivo `.env.example` contém a configuração local de SQLite e a chave usada para assinar os tokens de login:

```dotenv
DATABASE_URL="file:./database.sqlite"
JWT_SECRET=
```

Crie o arquivo SQLite vazio com `touch prisma/database.sqlite` antes de aplicar as migrations. O arquivo `.env` e os bancos locais não são versionados; cada ambiente cria seu próprio banco a partir das migrations.

Preencha `JWT_SECRET` com uma chave aleatória de pelo menos 32 bytes em cada ambiente. A API exige essa chave para iniciar e os tokens de login expiram em uma hora.

## Rotas

As rotas `POST` de cadastro recebem JSON e retornam `201 Created` em caso de sucesso. Login e listagens retornam `200 OK`.

| Método | Rota | Operação | Resposta |
| --- | --- | --- | --- |
| POST | `/users` | Usuário | `{ "id": "..." }` |
| POST | `/login` | Login de usuário | `{ "name": "marcos", "accessToken": "..." }` |
| POST | `/categories` | Categoria | `{ "id": "..." }` |
| GET | `/categories` | Listar categorias | `[{ "id": "...", "name": "Pastéis" }]` |
| GET | `/categories/:categoryId/products` | Listar produtos da categoria | `[{ "id": "...", "name": "Pastel de queijo", "description": "...", "categoryId": "...", "price": "12.5", "available": true }]` |
| GET | `/products` | Listar todos os produtos | `[{ "id": "...", "name": "Pastel de queijo", "description": "...", "categoryId": "...", "price": "12.5", "available": true }]` |
| POST | `/products` | Produto | `{ "id": "..." }` |
| PATCH | `/products/:productId` | Atualizar produto | `{ "id": "..." }` |
| POST | `/additions` | Cadastrar adicional | `{ "id": "..." }` |
| GET | `/additions` | Listar todos os adicionais | `[{ "id": "...", "name": "Queijo extra", "price": "2.5", "available": true }]` |
| GET | `/products/:productId/additions` | Listar adicionais do produto | `[{ "id": "...", "name": "Queijo extra", "price": "2.5", "available": true }]` |
| POST | `/orders` | Pedido | `{ "id": "...", "trackingToken": "...", "status": "PENDING", "total": "30" }` |
| GET | `/orders/tracking/:trackingToken` | Acompanhar pedido | `{ "status": "PREPARING", "updatedAt": "..." }` |
| PATCH | `/orders/:orderId/status` | Atualizar status do pedido | `{ "status": "READY", "id": "..." }` |
| GET | `/orders/pending` | Listar pedidos pendentes | `[{ "id": "...", "customerName": "Maria Silva", "customerPhone": "...", "status": "PENDING", "total": "30", "createdAt": "...", "items": [...] }]` |

### Usuários

```json
{
  "name": "marcos",
  "password": "Pastel123!"
}
```

O nome deve ser único. A senha deve conter pelo menos 8 caracteres, letras e números, respeitando o limite de 72 bytes do bcrypt. Somente o hash é persistido, e a resposta não inclui a senha.

Para entrar, envie o mesmo `name` e `password` no JSON de `POST /login`. A resposta contém o nome cadastrado e um token JWT com o ID do usuário em `sub`. Se o usuário não existir ou a senha não conferir, a API retorna `401 INVALID_CREDENTIALS`; campos inválidos retornam `400`.

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

Para atualizar o status, envie `PATCH /orders/:orderId/status` com `{ "status": "READY" }`. Os valores aceitos são `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED` e `CANCELED`. A atualização também cria um registro no histórico do pedido. Pedidos que deixam de estar pendentes não aparecem em `GET /orders/pending`. Nenhuma rota exige autenticação neste momento; configure a proteção antes de disponibilizar a API publicamente.

## Testar as requisições

O arquivo [api.http](api.http) contém exemplos das rotas de cadastro e consulta, pedidos com e sem adicionais e respostas de erro.

Com a API rodando e a migration de categorias aplicada, abra o arquivo em um cliente compatível com REST Client. Execute `criarUsuario` e `loginUsuario` antes de `criarAdicional`, e crie categoria, produto e adicional antes dos pedidos: os exemplos reutilizam os IDs das respostas. Altere `testId` ao repetir os cadastros para evitar nomes duplicados.

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

O Prisma Client é gerado em cada ambiente. A CI usa uma configuração local de SQLite e não precisa de credenciais ou de acesso ao banco de desenvolvimento.

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
