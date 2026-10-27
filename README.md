# NestJS WebSockets + Redis Streams

A **real-time notifications** demo with NestJS and Socket.IO. This is not a production chat. It shows two classic WebSocket problems and how to solve them:

1. **Multiple server instances** — a client on port `3001` must receive the same event that was emitted on `3002`.
2. **Brief client disconnect** — if the socket drops for a few seconds, reconnecting should recover messages sent while the client was offline (without losing them).

Redis Streams is the shared bus. Socket.IO **Connection State Recovery** replays missed events on reconnect.

## What this demonstrates

| Problem | How this repo solves it |
| --- | --- |
| A `server.emit()` only reaches clients on **that** instance | [`@socket.io/redis-streams-adapter`](https://github.com/socketio/socket.io-redis-streams-adapter): every instance publishes to and consumes the same stream |
| The client disconnects and misses everything in between | `connectionStateRecovery` (up to 2 minutes) + Redis AOF persistence |
| You need to **see** the effect locally / on camera | UI in `public/` + `npm run dev` starts **two** nodes (3001 and 3002) |

Message flow:

```
POST /notifications/notify
        ↓
NotificationsService  →  NotificationsGateway.broadcast()
        ↓
Socket.IO (this instance)  →  Redis Stream  →  other instances
        ↓
`notification` event to every connected client
```

If a client disconnects and comes back within the recovery window, Socket.IO resends stream events that were not acked. In the UI they show up with the **RECUPERADO** (recovered) badge.

## Requirements

- Node.js 20+
- Docker (Redis only)

Redis is published on the host at **6380** (the container still uses 6379) so it does not collide with another local Redis.

## How to run it

### 1. Redis

```bash
docker compose up -d
```

Check: `redis-cli -p 6380 ping` → `PONG`.

### 2. Dependencies and Redis URL

```bash
npm install
export REDIS_URL=redis://127.0.0.1:6380
```

`src/redis.ts` reads `REDIS_URL`. Without it, ioredis has nowhere to connect.

### 3. Start the demo cluster (recommended)

```bash
npm run dev
```

This boots two Nest processes:

| Instance | URL |
| --- | --- |
| `node-1` | http://localhost:3001 |
| `node-2` | http://localhost:3002 |

Open **one tab on each URL**. Each tab gets its own `clientId` in `sessionStorage`.

Single instance (no cluster script):

```bash
PORT=3000 REDIS_URL=redis://127.0.0.1:6380 npm run start:dev
```

→ http://localhost:3000

## UI demo

The page (`public/index.html`) is served as static assets from Nest.

- **Send**: form → `POST /notifications/notify` with `{ title, senderId }`. Every client on every instance receives `notification`.
- **Drop connection**: closes the WebSocket transport **without** auto-reconnect. Simulates a network cut.
- **Reconnect**: calls `socket.connect()` again. If messages were sent in between and less than 2 minutes have passed, they arrive marked as recovered.

### Scenario A — fan-out across instances

1. Tab A on `:3001`, tab B on `:3002`.
2. Type a message in A and send.
3. B receives it immediately even though the POST hit another process.

That proves the emit is not trapped in a single Node process’s memory.

### Scenario B — no lost messages after disconnect

1. On B, click **Drop connection** (status becomes `offline`).
2. From A (or another online tab), send one or more messages.
3. On B, click **Reconnect**.
4. Messages from the gap appear with **🔁 RECUPERADO**.

The adapter recovery window is **2 minutes** (`maxDisconnectionDuration`). After that, Socket.IO does not replay history.

## HTTP API

```http
POST /notifications/notify
Content-Type: application/json

{
  "title": "Hello",
  "body": "Optional text",
  "senderId": "user-abc12"
}
```

| Field | Default |
| --- | --- |
| `title` | `"Notification"` |
| `body` | `"New notification"` |
| `senderId` | omitted (the UI shows it as a generic notification) |

Example:

```bash
curl -X POST http://localhost:3001/notifications/notify \
  -H 'Content-Type: application/json' \
  -d '{"title":"From curl","senderId":"cli"}'
```

The payload reaches clients on both `3001` and `3002`.

Socket.IO event:

```ts
{
  id: string;       // UUID
  title: string;
  body: string;
  ts: number;       // Date.now()
  senderId?: string;
}
```

Default namespace (`/`). CORS is open (`origin: '*'`).

## Code map

| File | Role |
| --- | --- |
| `src/websocket/redis-streams.adapter.ts` | Socket.IO adapter + Redis Streams + recovery |
| `src/websocket/notfications.gateway.ts` | Gateway: `broadcast` → `server.emit('notification')` |
| `src/notifications/notifications.service.ts` | Builds the payload and calls the gateway |
| `src/notifications/notifications.controller.ts` | `POST /notifications/notify` |
| `src/redis.ts` | ioredis client (`REDIS_URL`) |
| `scripts/dev-cluster.ts` | Two processes on 3001 / 3002 |
| `public/index.html` | Demo client |
| `docker-compose.yml` | Redis 7 with AOF on port 6380 |

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Local cluster (two instances) |
| `npm run start:dev` | Single instance with watch |
| `npm run build` / `npm run start:prod` | Build and `node dist/main` |
| `npm test` | Vitest |

## Notes

- This is a **lab**. There is no auth, rooms, or durable per-user inbox: “don’t lose messages” means Socket.IO recovery on top of the stream, not a stored notification mailbox.
- Redis with `--appendonly yes` keeps the stream if you restart the container; it is not a notifications store.
- If Redis is down or `REDIS_URL` is wrong, the adapter cannot sync instances or recover events.
