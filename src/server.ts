/**
 * HTTP server to accept client transactions
 * Works with both Node.js and Bun runtimes
 */

import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'http';
import { Node } from './node';
import type { Transaction } from './types';

export function startServer(node: Node, serverPort?: number): Server {
  const port = serverPort || parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }

    if (req.method === 'POST' && url.pathname === '/transactions') {
      try {
        const body = await readBody(req);
        const tx = JSON.parse(body);
        node.receiveTransactionFromClient(tx as Transaction);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end(String(err?.message || err));
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  server.listen(port, host, () => {
    console.log(`HTTP server listening on http://${host}:${port} (accessible at http://localhost:${port})`);
  });

  return server;
}

/**
 * Helper to read the request body as a string
 */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}
