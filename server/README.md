# Masterpiece Market — Socket.IO Server

Standalone WebSocket server for real-time auction bidding.

## Quick Start

```bash
cd server
npm install
npm run dev
```

The server runs on `http://localhost:3001` by default.

## Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `auction:join` | `{ auction_id }` | Join an auction room and receive current state |
| `auction:bid` | `{ auction_id, bidder_id, amount }` | Place a bid |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `auction:state` | `{ current_bid, ends_at, title, bids }` | Full room state on join |
| `auction:bid` | `{ bidder_id, amount, time }` | New bid broadcast |
| `auction:extended` | `{ ends_at }` | Timer extended (late bid) |
| `auction:ended` | `{ auction_id, winning_bid, winner }` | Auction closed |
| `error` | `{ message }` | Error message |

## Configuration

- `SOCKET_PORT` (default: `3001`) — port to listen on

## Notes

- This is a v0 stub with in-memory state. No auth, no persistence.
- In production, auction state should be backed by Redis and bids validated via the API.
