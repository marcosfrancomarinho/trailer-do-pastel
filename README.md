# Trailer do Pastel

API para cadastrar usuários, produtos, adicionais e pedidos de uma pastelaria.

O cliente pode fazer um pedido sem criar uma conta. Os itens registram o nome e o preço informados no pedido, e a API consulta os produtos e adicionais para verificar se existem e estão disponíveis.

## Tecnologias

- Node.js 22 ou superior e TypeScript.
- Express 5 e CORS.
- Prisma 6 com SQLite e migrations versionadas.
- bcrypt para hash de senhas e comparação de credenciais.
- Decimal.js, encapsulado no VO `DecimalValue`, para cálculos monetários.
- Kit Dev para desenvolvimento, build, testes e injeção de dependências.

## Executar localmente

É necessário ter Node.js 22+ e Yarn 1 instalados.

```bash
git clone https://github.com/marcosfrancomarinho/trailer-do-pastel.git
cd trailer-do-pastel
cp .env.example .env
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

O arquivo `.env.example` contém uma configuração local de SQLite:

```dotenv
DATABASE_URL="file:./database.sqlite"
```

Crie o arquivo SQLite vazio com `touch prisma/database.sqlite` antes de aplicar as migrations. As migrations criam as tabelas do projeto nesse arquivo. O arquivo `.env` e os bancos locais não são versionados; cada ambiente cria seu próprio banco a partir das migrations.

## Rotas

Todas as rotas recebem JSON e retornam `201 Created` em caso de sucesso.

| Método | Rota | Cadastro | Resposta |
| --- | --- | --- | --- |
| POST | `/users` | Usuário | `{ "id": "..." }` |
| POST | `/products` | Produto | `{ "id": "..." }` |
| POST | `/additions` | Adicional | `{ "id": "..." }` |
| POST | `/orders` | Pedido | `{ "id": "...", "trackingToken": "...", "status": "PENDING", "total": "30" }` |

### Usuários

```json
{
  "name": "marcos",
  "password": "Pastel123!"
}
```

O nome deve ser único. A senha deve conter pelo menos 8 caracteres, letras e números, respeitando o limite de 72 bytes do bcrypt. Somente o hash é persistido, e a resposta não inclui a senha.

### Produtos

```json
{
  "name": "Pastel de queijo",
  "description": "Pastel recheado com queijo e orégano",
  "price": "12.50",
  "available": true
}
```

### Adicionais

```json
{
  "name": "Queijo extra",
  "price": "2.50",
  "available": true
}
```

Os nomes de produtos e adicionais devem ser únicos em seus respectivos cadastros. Os preços são strings decimais e precisam ser maiores que zero. O campo `available` é opcional e assume `true` quando omitido.

### Pedidos

Crie o produto e o adicional primeiro e use os IDs retornados:

```json
{
  "customerName": "Maria Silva",
  "customerPhone": "11999999999",
  "items": [
    {
      "productId": "ID_DO_PRODUTO",
      "productName": "Pastel de queijo",
      "unitPrice": "12.50",
      "quantity": 2,
      "additions": [
        {
          "additionId": "ID_DO_ADICIONAL",
          "unitPrice": "2.50",
          "quantity": 1
        }
      ]
    }
  ]
}
```

O nome do produto e os preços unitários vêm do payload. O pedido precisa ter pelo menos um item, e as quantidades devem ser inteiros positivos. Os adicionais são opcionais; quando omitidos, o controller envia um array vazio. Um mesmo adicional não pode se repetir no item: informe sua quantidade em `quantity`.

A quantidade do adicional é aplicada a cada unidade do produto:

```text
total do item = (preço do produto + soma(preço do adicional × quantidade do adicional)) × quantidade do produto
total do pedido = soma dos totais dos itens
```

No exemplo, dois pastéis de `12.50`, cada um com um adicional de `2.50`, totalizam `30`. A API calcula o total e cria o pedido com status `PENDING` e um token de acompanhamento.

## Testar as requisições

O arquivo [api.http](api.http) contém exemplos de todos os cadastros, pedidos com e sem adicionais e respostas de erro.

Com a API rodando, abra o arquivo em um cliente compatível com REST Client e execute as requisições. Execute `criarProduto` e `criarAdicional` antes dos pedidos: os exemplos reutilizam os IDs das respostas. Altere `testId` ao repetir os cadastros para evitar nomes duplicados.

## Erros

Os controllers encaminham os erros para o middleware `ErrorHandler`.

| Status | Situação |
| --- | --- |
| 400 | Erro de validação do domínio |
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

Os casos de uso expõem o método `create()`. A montagem dos itens e adicionais do pedido fica nos services de aplicação, e as regras de negócio são validadas nas entidades e nos VOs.
