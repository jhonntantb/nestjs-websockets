import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import type { Server, ServerOptions } from "socket.io";
import { redis } from "../redis.js";

export class RedisStreamsAdapter extends IoAdapter {
    createIOServer(port: number, options?: ServerOptions) {
        const server: Server = super.createIOServer(port, {
            ...options,
            connectionStateRecovery: {
                maxDisconnectionDuration: 2 * 60 * 1000,
            },
        } as ServerOptions);

        server.adapter(createAdapter(redis));
        return server;
    }
}