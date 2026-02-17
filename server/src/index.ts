import { Server } from "socket.io";

const PORT = Number(process.env.SOCKET_PORT ?? 3001);

const io = new Server(PORT, {
  cors: { origin: ["http://localhost:3000"], methods: ["GET", "POST"] },
});

console.log(`Socket.IO server listening on port ${PORT}`);

// ── In-memory auction state (v0 stub) ──────────────────────
interface AuctionRoom {
  auction_id: string;
  title: string;
  current_bid: number;
  current_bidder: string | null;
  ends_at: string;
  bids: { bidder_id: string; amount: number; time: string }[];
}

const rooms = new Map<string, AuctionRoom>();

// Seed one demo room matching the sample auction
rooms.set("auc-001", {
  auction_id: "auc-001",
  title: "Nighthawks — Edward Hopper",
  current_bid: 42_000,
  current_bidder: null,
  ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
  bids: [],
});

// ── Connection handling ────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join an auction room
  socket.on("auction:join", ({ auction_id }: { auction_id: string }) => {
    socket.join(auction_id);
    console.log(`${socket.id} joined room ${auction_id}`);

    // Get or create room state
    let room = rooms.get(auction_id);
    if (!room) {
      room = {
        auction_id,
        title: `Auction ${auction_id}`,
        current_bid: 0,
        current_bidder: null,
        ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        bids: [],
      };
      rooms.set(auction_id, room);
    }

    // Send current state to the joining client
    socket.emit("auction:state", {
      current_bid: room.current_bid,
      ends_at: room.ends_at,
      title: room.title,
      bids: room.bids.slice(0, 50), // last 50 bids
    });
  });

  // Handle a bid
  socket.on(
    "auction:bid",
    ({ auction_id, bidder_id, amount }: { auction_id: string; bidder_id: string; amount: number }) => {
      const room = rooms.get(auction_id);
      if (!room) {
        socket.emit("error", { message: "Auction room not found" });
        return;
      }

      // Basic validation
      if (amount <= room.current_bid) {
        socket.emit("error", { message: `Bid must be higher than ${room.current_bid}` });
        return;
      }

      // Update room state
      const bidEvent = { bidder_id, amount, time: new Date().toISOString() };
      room.current_bid = amount;
      room.current_bidder = bidder_id;
      room.bids.unshift(bidEvent);

      console.log(`Bid in ${auction_id}: ${amount} by ${bidder_id.slice(0, 8)}`);

      // Extend timer if within 15 seconds of end
      const endsAt = new Date(room.ends_at).getTime();
      const now = Date.now();
      if (endsAt - now < 15_000) {
        room.ends_at = new Date(now + 15_000).toISOString();
        io.to(auction_id).emit("auction:extended", { ends_at: room.ends_at });
      }

      // Broadcast to all clients in the room
      io.to(auction_id).emit("auction:bid", bidEvent);
    },
  );

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ── Periodic check for auction end (simplified) ────────────
setInterval(() => {
  for (const [id, room] of rooms) {
    if (new Date(room.ends_at).getTime() <= Date.now()) {
      console.log(`Auction ${id} ended. Winner: ${room.current_bidder ?? "none"}, Bid: ${room.current_bid}`);
      io.to(id).emit("auction:ended", {
        auction_id: id,
        winning_bid: room.current_bid,
        winner: room.current_bidder,
      });
      rooms.delete(id);
    }
  }
}, 5000);
