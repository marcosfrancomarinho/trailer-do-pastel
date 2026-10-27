# Trailer do Pastel — API

[![CI](https://github.com/marcosfrancomarinho/trailer-do-pastel/actions/workflows/ci.yml/badge.svg)](https://github.com/marcosfrancomarinho/trailer-do-pastel/actions/workflows/ci.yml)

Backend do sistema de pedidos do **Trailer do Pastel**. Oferece cardápio público, pedidos para retirada, acompanhamento por token, atendimento em mesas, comandas e gerenciamento por funcionários.

Desenvolvido com **Node.js, TypeScript, Express, Prisma e PostgreSQL**. Utiliza JWT para autenticação e valores decimais para cálculos de preços.

## Como executar

Requisitos: **Node.js 22+**, **Yarn 1** e **PostgreSQL**.

```bash
git clone https://github.com/marcosfrancomarinho/trailer-do-pastel.git
cd trailer-do-pastel
cp postgresql.env.example .env
yarn install --frozen-lockfile
yarn prisma generate
yarn prisma migrate deploy
yarn dev
```

Antes de executar as migrations, crie o banco `trailer_do_pastel` e configure o `.env`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trailer_do_pastel?schema=public"
JWT_SECRET="COLOQUE_AQUI_UMA_CHAVE_ALEATORIA_SEGURA"
```

Gere uma chave secreta com `openssl rand -hex 32` (no mínimo 32 bytes). A API exige `JWT_SECRET` para iniciar.

**Endereço local:** `http://localhost:3000`.

Comandos principais:
- `yarn dev --watch`: desenvolvimento com reinício automático.
- `yarn test`: testes.
- `yarn type`: verificação de tipos.
- `yarn build` e `yarn start`: compilação e execução da versão de produção.

## Como usar a API

Todas as requisições com corpo usam `Content-Type: application/json`. Rotas protegidas exigem:

```http
Authorization: Bearer SEU_ACCESS_TOKEN
```

Há dois perfis:
- **ADMIN:** administra usuários, catálogo, funcionamento da loja e histórico geral; também opera pedidos e mesas.
- **EMPLOYEE:** opera pedidos e mesas, mas não gerencia usuários, catálogo, loja ou histórico geral de comandas.

Rotas identificadas como **públicas** não exigem login. Cada rota abaixo apresenta uma chamada HTTP em bloco de código e, quando aplicável, exemplos de corpo e resposta. Nos exemplos, IDs como `produto-123` são **ilustrativos**: substitua pelo `id` real devolvido pela API. Preços são enviados como strings, por exemplo `"12.50"`.

## 1. Login e usuários

### `POST /login` — entrar no painel (pública)

Autentica um usuário e devolve o token que será enviado nas demais operações protegidas.

```http
POST /login
Content-Type: application/json
```

```json
{
  "name": "atendente",
  "password": "Senha123"
}
```

**Resposta — 200:**
```json
{
  "name": "atendente",
  "role": "EMPLOYEE",
  "accessToken": "TOKEN_JWT"
}
```

### `POST /users` — cadastrar funcionário (ADMIN)

**Exemplo de requisição:**

```http
POST /users
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


```json
{
  "name": "joao",
  "password": "Senha123"
}
```

**Resposta — 201:** `{ "id": "usuario-123" }`. Usuários criados por essa rota são sempre `EMPLOYEE`; o nome deve ser único e a senha precisa ter pelo menos 8 caracteres com letras e números.



**Exemplo de resposta — 200:**

```json
{
  "id": "usuario-123"
}
```
### `GET /users` — listar usuários (ADMIN)

**Exemplo de requisição:**

```http
GET /users
Authorization: Bearer SEU_ACCESS_TOKEN
```


Retorna os usuários com ID, nome, perfil e data de criação, sem expor senhas.

**Resposta — 200 (exemplo):**
```json
[
  { "id": "usuario-123", "name": "joao", "role": "EMPLOYEE", "createdAt": "2026-10-27T12:00:00.000Z" }
]
```

### `DELETE /users/:userId` — excluir usuário (ADMIN)

**Exemplo de requisição:**

```http
DELETE /users/usuario-123
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `DELETE /users/usuario-123`. Retorna **204**, sem corpo. O administrador não pode excluir a própria conta.

### Primeiro administrador

O primeiro `ADMIN` é criado diretamente no PostgreSQL. Gere o hash bcrypt da senha (nunca armazene a senha em texto puro):

```bash
read -r -s -p 'Senha do administrador: ' admin_password
printf '\n'
printf '%s' "$admin_password" | node -e 'const bcrypt = require("bcrypt"); let p = ""; process.stdin.on("data", c => p += c); process.stdin.on("end", async () => console.log(await bcrypt.hash(p, 12)));'
unset admin_password
```

Depois, substitua `<HASH_BCRYPT>` pelo hash gerado:

```sql
INSERT INTO users (id, name, password, role)
VALUES (gen_random_uuid()::text, 'admin', '<HASH_BCRYPT>', 'ADMIN');
```

O sistema permite apenas um administrador.

## 2. Funcionamento da loja



**Resposta — 204:** sem corpo.
### `GET /store/status` — consultar funcionamento (pública)

**Exemplo de requisição:**

```http
GET /store/status
```


Permite ao frontend descobrir se o cardápio aceita novos pedidos.

**Resposta — 200:**
```json
{ "status": "OPEN", "updatedAt": "2026-10-27T12:00:00.000Z" }
```

### `POST /store/open` — abrir loja (ADMIN)

**Exemplo de requisição:**

```http
POST /store/open
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


Autoriza novos pedidos online. Não exige corpo JSON. Retorna **200**, com `status: "OPEN"` e `updatedAt`.



**Exemplo de resposta — 200:**

```json
{
  "status": "OPEN",
  "updatedAt": "2026-10-27T12:00:00.000Z"
}
```
### `POST /store/close` — fechar loja (ADMIN)

**Exemplo de requisição:**

```http
POST /store/close
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


Bloqueia novos pedidos online. Retorna **200**, com `status: "CLOSED"` e `updatedAt`. Pedidos já registrados continuam disponíveis para preparo e conclusão.

## 3. Categorias



**Exemplo de resposta — 200:**

```json
{
  "status": "CLOSED",
  "updatedAt": "2026-10-27T12:30:00.000Z"
}
```
### `POST /categories` — criar categoria (ADMIN)

**Exemplo de requisição:**

```http
POST /categories
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


```json
{ "name": "Pastéis" }
```

**Resposta — 201:** `{ "id": "categoria-123" }`.



**Exemplo de resposta — 200:**

```json
{
  "id": "categoria-123"
}
```
### `GET /categories` — consultar categorias (pública)

**Exemplo de requisição:**

```http
GET /categories
```


Lista as categorias do cardápio.

```json
[
  { "id": "categoria-123", "name": "Pastéis" },
  { "id": "categoria-456", "name": "Sucos" }
]
```



**Exemplo de resposta — 200:**

```json
[
  {
    "id": "categoria-123",
    "name": "Pastéis"
  }
]
```
### `PATCH /categories/:categoryId` — renomear categoria (ADMIN)

**Exemplo de requisição:**

```http
PATCH /categories/categoria-123
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `PATCH /categories/categoria-123` com `{ "name": "Pastéis especiais" }`. Retorna **200** com o ID.



**Exemplo de resposta — 200:**

```json
{
  "id": "categoria-123"
}
```
### `DELETE /categories/:categoryId` — excluir categoria (ADMIN)

**Exemplo de requisição:**

```http
DELETE /categories/categoria-123
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `DELETE /categories/categoria-123`. Retorna **204**; as regras de integridade podem impedir a exclusão de uma categoria em uso.



**Resposta — 204:** sem corpo.
### `GET /categories/:categoryId/products` — produtos de uma categoria (pública)

**Exemplo de requisição:**

```http
GET /categories/categoria-123/products
```


Exemplo: `GET /categories/categoria-123/products`. Retorna **200**, com lista de produtos, inclusive indisponíveis.

## 4. Produtos e adicionais



**Exemplo de resposta — 200:**

```json
[
  {
    "id": "produto-123",
    "name": "Pastel de queijo",
    "description": "Queijo e orégano",
    "categoryId": "categoria-123",
    "price": "12.5",
    "imageUrl": null,
    "available": true
  }
]
```
### `POST /additions` — criar adicional (ADMIN)

**Exemplo de requisição:**

```http
POST /additions
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


```json
{
  "name": "Queijo extra",
  "price": "2.50",
  "available": true
}
```

**Resposta — 201:** `{ "id": "adicional-123" }`.



**Exemplo de resposta — 200:**

```json
{
  "id": "adicional-123"
}
```
### `GET /additions` — listar adicionais (pública)

**Exemplo de requisição:**

```http
GET /additions
```


Exemplo de resposta **200**:

```json
[
  { "id": "adicional-123", "name": "Queijo extra", "price": "2.5", "available": true }
]
```

### `PATCH /additions/:additionId` — alterar adicional (ADMIN)

**Exemplo de requisição:**

```http
PATCH /additions/adicional-123
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `PATCH /additions/adicional-123`:

```json
{ "price": "3.00", "available": false }
```

**Resposta — 200:** `{ "id": "adicional-123" }`. Envie apenas os campos que deseja alterar.



**Exemplo de resposta — 200:**

```json
{
  "id": "adicional-123"
}
```
### `DELETE /additions/:additionId` — excluir adicional (ADMIN)

**Exemplo de requisição:**

```http
DELETE /additions/adicional-123
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `DELETE /additions/adicional-123`. Retorna **204**, sem corpo.



**Resposta — 204:** sem corpo.
### `POST /products` — cadastrar produto (ADMIN)

**Exemplo de requisição:**

```http
POST /products
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


Cria um produto com preço, categoria, imagem opcional e adicionais permitidos.

```json
{
  "name": "Pastel de queijo",
  "description": "Pastel recheado com queijo e orégano",
  "categoryId": "categoria-123",
  "price": "12.50",
  "imageUrl": "https://exemplo.com/pastel-queijo.jpg",
  "available": true,
  "additionIds": ["adicional-123"]
}
```

**Resposta — 201:** `{ "id": "produto-123" }`.

Os campos obrigatórios são `name`, `description`, `categoryId` e `price`. Para um produto sem adicionais, omita `additionIds` ou envie `[]`. `imageUrl` também pode ser `null`.



**Exemplo de resposta — 200:**

```json
{
  "id": "produto-123"
}
```
### `GET /products` — listar cardápio (pública)

**Exemplo de requisição:**

```http
GET /products
```


Retorna **200**, com todos os produtos, inclusive indisponíveis.

```json
[
  {
    "id": "produto-123",
    "name": "Pastel de queijo",
    "description": "Pastel recheado com queijo e orégano",
    "categoryId": "categoria-123",
    "price": "12.5",
    "imageUrl": "https://exemplo.com/pastel-queijo.jpg",
    "available": true
  }
]
```

### `GET /products/:productId/additions` — adicionais de um produto (pública)

**Exemplo de requisição:**

```http
GET /products/produto-123/additions
```


Exemplo: `GET /products/produto-123/additions`. Retorna **200**, com os adicionais associados ao produto.



**Exemplo de resposta — 200:**

```json
[
  {
    "id": "adicional-123",
    "name": "Queijo extra",
    "price": "2.5",
    "available": true
  }
]
```
### `PATCH /products/:productId` — atualizar produto (ADMIN)

**Exemplo de requisição:**

```http
PATCH /products/produto-123
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `PATCH /products/produto-123`:

```json
{
  "price": "14.50",
  "available": false,
  "additionIds": []
}
```

**Resposta — 200:** `{ "id": "produto-123" }`. O exemplo altera o preço, torna o produto indisponível e remove os vínculos de adicionais. Omitir `additionIds` preserva os vínculos existentes.



**Exemplo de resposta — 200:**

```json
{
  "id": "produto-123"
}
```
### `DELETE /products/:productId` — excluir produto (ADMIN)

**Exemplo de requisição:**

```http
DELETE /products/produto-123
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `DELETE /products/produto-123`. Retorna **204**, sem corpo.

## 5. Pedidos dos clientes



**Resposta — 204:** sem corpo.
### `POST /orders` — criar pedido (pública para pedidos sem mesa)

**Exemplo de requisição:**

```http
POST /orders
Content-Type: application/json
```


O cliente escolhe produtos, quantidades e adicionais. O backend consulta os preços cadastrados, valida a disponibilidade e calcula o total — o frontend **não envia o valor final**.

```json
{
  "customerName": "Maria Silva",
  "customerPhone": "(99) 99999-9999",
  "observation": "Sem cebola",
  "items": [
    {
      "productId": "produto-123",
      "quantity": 2,
      "additions": [
        { "additionId": "adicional-123", "quantity": 1 }
      ]
    }
  ]
}
```

Neste cenário, considerando pastel de **R$ 12,50** e queijo extra de **R$ 2,50**, dois pastéis custam **R$ 30,00**.

**Resposta — 201 (exemplo):**

```json
{
  "id": "pedido-123",
  "trackingToken": "token-de-acompanhamento",
  "status": "PENDING",
  "total": "30",
  "tableId": null
}
```

O `trackingToken` é enviado ao cliente para acompanhar exclusivamente esse pedido. `items` exige pelo menos um item e `observation` é opcional (até 500 caracteres). Os produtos e seus valores são registrados no pedido para preservar o preço cobrado, mesmo depois de mudanças no catálogo.

### `GET /orders/tracking/:trackingToken` — acompanhar pedido (pública)

**Exemplo de requisição:**

```http
GET /orders/tracking/token-de-acompanhamento
```


Exemplo: `GET /orders/tracking/token-de-acompanhamento`.

**Resposta — 200:**
```json
{
  "status": "PREPARING",
  "updatedAt": "2026-10-27T12:20:00.000Z"
}
```

Essa rota permite à página do cliente verificar se o pedido foi aceito, está em preparo, foi concluído ou cancelado, sem login.

### `GET /orders/pending` — pedidos aguardando atendimento (equipe)

**Exemplo de requisição:**

```http
GET /orders/pending?date=2026-10-27
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `GET /orders/pending?date=2026-10-27`. Retorna **200**, com um array de pedidos `PENDING`, do mais antigo ao mais novo.



**Exemplo de resposta — 200:**

```json
[
  {
    "id": "pedido-123",
    "customerName": "Maria Silva",
    "customerPhone": "99999999999",
    "observation": null,
    "tableId": null,
    "tableNumber": null,
    "status": "PENDING",
    "total": "30",
    "createdAt": "2026-10-27T12:00:00.000Z",
    "items": []
  }
]
```
### `GET /orders/preparing` — pedidos confirmados e em preparo (equipe)

**Exemplo de requisição:**

```http
GET /orders/preparing?date=2026-10-27
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `GET /orders/preparing?date=2026-10-27`. Retorna **200**, com pedidos `CONFIRMED` e `PREPARING`, incluindo a data da última atualização.



**Exemplo de resposta — 200:**

```json
[
  {
    "id": "pedido-123",
    "customerName": "Maria Silva",
    "customerPhone": "99999999999",
    "observation": null,
    "tableId": null,
    "tableNumber": null,
    "status": "PREPARING",
    "total": "30",
    "createdAt": "2026-10-27T12:00:00.000Z",
    "updatedAt": "2026-10-27T12:05:00.000Z",
    "items": []
  }
]
```
### `GET /orders/history` — histórico de pedidos (equipe)

**Exemplo de requisição:**

```http
GET /orders/history?date=2026-10-27
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `GET /orders/history?date=2026-10-27`. Retorna **200**, com pedidos `COMPLETED` e `CANCELED`, incluindo as mudanças de status.

As três listagens aceitam `date=AAAA-MM-DD`; sem o parâmetro, usam o dia atual no horário de Imperatriz (UTC−03:00). O filtro considera a **data de criação** do pedido.



**Exemplo de resposta — 200:**

```json
[
  {
    "id": "pedido-123",
    "customerName": "Maria Silva",
    "customerPhone": "99999999999",
    "observation": null,
    "tableId": null,
    "tableNumber": null,
    "status": "COMPLETED",
    "total": "30",
    "createdAt": "2026-10-27T12:00:00.000Z",
    "updatedAt": "2026-10-27T12:20:00.000Z",
    "items": [],
    "histories": [
      {
        "status": "PENDING",
        "changedAt": "2026-10-27T12:00:00.000Z"
      },
      {
        "status": "COMPLETED",
        "changedAt": "2026-10-27T12:20:00.000Z"
      }
    ]
  }
]
```
### `PATCH /orders/:orderId/status` — atualizar andamento (equipe)

**Exemplo de requisição:**

```http
PATCH /orders/pedido-123/status
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `PATCH /orders/pedido-123/status`:

```json
{ "status": "CONFIRMED" }
```

**Resposta — 200:**
```json
{ "id": "pedido-123", "status": "CONFIRMED" }
```

Os estados são:
- `PENDING`: recebido, aguardando atendimento.
- `CONFIRMED`: aceito pela equipe.
- `PREPARING`: em preparo.
- `COMPLETED`: concluído.
- `CANCELED`: cancelado.

Para avançar o pedido, envie outro `PATCH` com o status correspondente, respeitando as transições permitidas pelas regras de negócio. `COMPLETED` e `CANCELED` são estados finais. Cada alteração fica registrada no histórico.

## 6. Mesas e comandas

As rotas desta seção exigem login de **ADMIN ou EMPLOYEE**, exceto o histórico geral indicado como exclusivo do administrador.

### `POST /tables` — cadastrar mesa

**Exemplo de requisição:**

```http
POST /tables
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


```json
{ "number": 12, "status": "FREE" }
```

**Resposta — 201 (exemplo):**
```json
{ "id": "mesa-123", "status": "FREE", "totalSpent": "0" }
```

`FREE` significa livre; `OCCUPIED` significa ocupada. O número deve ser único entre as mesas ativas.

### `GET /tables` — consultar mapa de mesas

**Exemplo de requisição:**

```http
GET /tables
Authorization: Bearer SEU_ACCESS_TOKEN
```


**Resposta — 200 (exemplo):**
```json
[
  { "id": "mesa-123", "number": 12, "status": "FREE", "totalSpent": "0" }
]
```

O frontend usa essa lista para indicar quais mesas estão livres ou ocupadas e o total consumido.

### `POST /orders` — criar pedido para uma mesa (equipe)

**Exemplo de requisição:**

```http
POST /orders
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


É a **mesma rota de pedidos**, mas com `tableId` e autenticação obrigatória.

```json
{
  "customerName": "Cliente da mesa 12",
  "customerPhone": "99999999999",
  "tableId": "mesa-123",
  "items": [
    { "productId": "produto-123", "quantity": 2, "additions": [] }
  ]
}
```

**Resposta — 201 (exemplo):**
```json
{
  "id": "pedido-456",
  "trackingToken": "token-da-mesa",
  "status": "PENDING",
  "total": "25",
  "tableId": "mesa-123"
}
```

O pedido ocupa a mesa, abre uma comanda se necessário e acrescenta seu valor ao total acumulado. O sistema também identifica o usuário autenticado responsável pela criação.

### `GET /tables/:tableId/orders` — consultar comanda aberta

**Exemplo de requisição:**

```http
GET /tables/mesa-123/orders
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `GET /tables/mesa-123/orders`.

**Resposta — 200 (resumida):**
```json
{
  "tableId": "mesa-123",
  "number": 12,
  "status": "OCCUPIED",
  "totalSpent": "25",
  "sessionId": "comanda-123",
  "orders": [
    {
      "id": "pedido-456",
      "customerName": "Cliente da mesa 12",
      "status": "PENDING",
      "total": "25",
      "createdBy": { "name": "atendente", "role": "EMPLOYEE" },
      "items": [
        { "productId": "produto-123", "productName": "Pastel de queijo", "quantity": 2, "unitPrice": "12.5", "additions": [] }
      ]
    }
  ]
}
```

O exemplo mostra os campos principais; a resposta real também inclui outros dados do pedido, como datas e observações. Uma mesa livre retorna `sessionId: null` e `orders: []`.

### `DELETE /tables/:tableId/orders/:orderId` — cancelar pedido da mesa

**Exemplo de requisição:**

```http
DELETE /tables/mesa-123/orders/pedido-456
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `DELETE /tables/mesa-123/orders/pedido-456`.

Cancela um pedido que ainda está `PENDING`, `CONFIRMED` ou `PREPARING`, desvincula-o da mesa e desconta seu valor do total, mantendo o registro na comanda para auditoria.

**Resposta — 200 (exemplo):**
```json
{
  "orderId": "pedido-456",
  "tableId": null,
  "status": "CANCELED",
  "totalSpent": "0"
}
```

### `PATCH /tables/:tableId/release` — encerrar comanda e liberar mesa

**Exemplo de requisição:**

```http
PATCH /tables/mesa-123/release
Content-Type: application/json
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `PATCH /tables/mesa-123/release`. Só funciona quando todos os pedidos ainda vinculados à mesa estão concluídos ou cancelados.

**Resposta — 200 (exemplo):**
```json
{
  "id": "mesa-123",
  "status": "FREE",
  "totalSpent": "0",
  "sessionId": "comanda-123",
  "closedTotal": "25"
}
```

O valor final fica salvo na comanda encerrada; a mesa volta a ficar disponível.

### `GET /tables/:tableId/sessions` — histórico de uma mesa

**Exemplo de requisição:**

```http
GET /tables/mesa-123/sessions
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `GET /tables/mesa-123/sessions`.

Retorna **200**, com `tableId` e `sessions`: comandas abertas e encerradas, com horários, valores e pedidos, inclusive cancelados.



**Exemplo de resposta — 200:**

```json
{
  "tableId": "mesa-123",
  "sessions": [
    {
      "id": "comanda-123",
      "openedAt": "2026-10-27T12:00:00.000Z",
      "closedAt": "2026-10-27T13:00:00.000Z",
      "closedTotal": "25",
      "orders": []
    }
  ]
}
```
### `GET /tables/sessions/history?date=2026-10-27` — histórico geral (ADMIN)

**Exemplo de requisição:**

```http
GET /tables/sessions/history?date=2026-10-27
Authorization: Bearer SEU_ACCESS_TOKEN
```


Consulta as comandas fechadas e os pedidos online finalizados no dia informado.

Retorna **200** com `comandas`; cada registro indica a origem `TABLE` ou `ONLINE` e traz a sessão/pedidos correspondentes. A data é obrigatória, no formato `AAAA-MM-DD`, e considera o fuso local de Imperatriz.



**Exemplo de resposta — 200:**

```json
{
  "comandas": [
    {
      "tableId": "mesa-123",
      "tableNumber": 12,
      "origin": "TABLE",
      "session": {
        "id": "comanda-123",
        "openedAt": "2026-10-27T12:00:00.000Z",
        "closedAt": "2026-10-27T13:00:00.000Z",
        "closedTotal": "25",
        "orders": []
      }
    }
  ]
}
```
### `DELETE /tables/:tableId` — remover mesa livre

**Exemplo de requisição:**

```http
DELETE /tables/mesa-123
Authorization: Bearer SEU_ACCESS_TOKEN
```


Exemplo: `DELETE /tables/mesa-123`. Retorna **204**, sem corpo. Uma mesa ocupada não pode ser removida; as comandas antigas são preservadas.



**Resposta — 204:** sem corpo.
## Erros comuns

- **400:** dados ausentes, inválidos ou fora das regras.
- **401:** falta de token ou credenciais inválidas.
- **403:** usuário sem permissão para a operação.
- **404:** recurso inexistente.
- **409:** conflito, como nome duplicado, recurso em uso ou operação não permitida no estado atual.
- **500:** erro inesperado.

Exemplo de erro de negócio:
```json
{
  "field": "name",
  "code": "ALREADY_EXISTS",
  "message": "Já existe um produto cadastrado com esse nome."
}
```

## Testes de API

O arquivo **[api.http](api.http)** inclui requisições executáveis com a extensão REST Client do VS Code. Faça login primeiro, use o `accessToken` nas rotas protegidas e reutilize os IDs retornados ao criar categoria, produto, adicional, pedido e mesa.

> Os IDs, URLs de imagem, nomes e horários desta documentação são exemplos ilustrativos. A estrutura das requisições segue as rotas do backend.
