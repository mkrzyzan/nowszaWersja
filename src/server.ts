/**
 * Bun-based HTTP/WebSocket server to accept client transactions and gossip messages
 */

import { Node } from './node';
import type { Transaction, NetworkMessage } from './types';

export function startServer(node: Node) {
  const port = parseInt(process.env.PORT || '3000');

  const host = process.env.HOST || '0.0.0.0';

  Bun.serve({
    port,
    hostname: host,
    fetch: async (req: Request) => {
      const url = new URL(req.url);

      if (req.method === 'GET' && url.pathname === '/health') {
        return new Response('ok');
      }

      if (req.method === 'POST' && url.pathname === '/transactions') {
        try {
          const tx = await req.json();
          node.receiveTransactionFromClient(tx as Transaction);
          return new Response(JSON.stringify({ status: 'ok' }), { status: 201, headers: { 'Content-Type': 'application/json' } });
        } catch (err: any) {
          return new Response(String(err?.message || err), { status: 400 });
        }
      }

      if (req.method === 'POST' && url.pathname === '/gossip') {
        try {
          const msg = await req.json();
          node.receiveGossipMessage(msg as NetworkMessage);
          return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (err: any) {
          return new Response(String(err?.message || err), { status: 400 });
        }
      }

      return new Response('Not found', { status: 404 });
    }
  });

  console.log(`Bun server listening on http://${host}:${port} (accessible at http://localhost:${port})`);
}
