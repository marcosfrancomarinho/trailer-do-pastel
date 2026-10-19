import 'dotenv/config';
import { container } from './di/providers.js';
import { Server } from './infrastructure/http/server.js';

function main() {
  const server = container.get(Server);
  server.run();
}

void main();
