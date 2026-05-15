# WhatsApp Monitor

Plataforma para visualizar e responder conversas do WhatsApp, mostrando tanto as mensagens do cliente quanto as enviadas pela IA do n8n.

## Configuração

### 1. Variáveis de ambiente

Edite o arquivo `.env.local` com suas credenciais:

```env
WA_PHONE_NUMBER_ID=   # ID do número no Meta Business Manager
WA_ACCESS_TOKEN=      # Token permanente da WhatsApp Cloud API
API_SECRET=           # Qualquer string secreta (ex: gerada com openssl rand -hex 32)
```

Para obter as credenciais do WhatsApp:
- Acesse Meta for Developers
- Vá em **WhatsApp > Configuração da API**
- Copie o **ID do número de telefone** e gere um **token permanente**

### 2. Instalar, banco e rodar

```bash
# Instalar dependências e inicializar banco de dados
npm run setup

# Desenvolvimento
npm run dev

# Produção (depois do setup)
npm start
```

### 3. Configurar o n8n

Adicione dois nós **HTTP Request** no seu fluxo do n8n:

#### Nó 1 — Logo após receber o webhook do WhatsApp (mensagem do cliente)

- **Método**: POST
- **URL**: `http://localhost:3000/api/log` (ou o IP/domínio do servidor)
- **Header**: `x-api-secret: SUA_API_SECRET`
- **Body (JSON)**:
```json
{
  "phoneNumber": "={{ $json.entry[0].changes[0].value.contacts[0].wa_id }}",
  "contactName": "={{ $json.entry[0].changes[0].value.contacts[0].profile.name }}",
  "content": "={{ $json.entry[0].changes[0].value.messages[0].text.body }}",
  "direction": "incoming",
  "senderType": "client",
  "timestamp": "={{ $now }}"
}
```

#### Nó 2 — Logo após o nó que envia a mensagem da IA pelo WhatsApp

- **Método**: POST
- **URL**: `http://localhost:3000/api/log`
- **Header**: `x-api-secret: SUA_API_SECRET`
- **Body (JSON)** (adapte os nomes dos nós anteriores):
```json
{
  "phoneNumber": "={{ $('NomeDoNoDeEnvio').item.json.to }}",
  "content": "={{ $('NomeDoNoDeEnvio').item.json.text.body }}",
  "direction": "outgoing",
  "senderType": "ai",
  "waMessageId": "={{ $json.messages[0].id }}",
  "timestamp": "={{ $now }}"
}
```

### 4. Deploy no VPS (com PM2)

```bash
npm run setup
pm2 start npm --name whatsapp-platform -- start
pm2 save
```

Configure o Nginx para redirecionar o domínio para `localhost:3000`.

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/log` | Recebe logs do n8n (requer header `x-api-secret`) |
| `GET`  | `/api/conversations` | Lista todas as conversas |
| `GET`  | `/api/conversations/:phone/messages` | Mensagens de uma conversa |
| `GET`  | `/api/stream?phone=xxx` | SSE — atualizações em tempo real |
| `POST` | `/api/send` | Envia mensagem como operador |

## Legenda de cores no chat

| Cor | Quem enviou |
|-----|------------|
| Branco (esquerda) | Cliente |
| Verde (direita) | IA |
| Azul (direita) | Operador humano |
