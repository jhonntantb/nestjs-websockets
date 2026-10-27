// Boots two NestJS instances so you can show cross-instance delivery on camera.
import { spawn, type ChildProcess } from 'node:child_process';

const instances = [
  { id: 'node-1', port: '3001', color: '\x1b[36m' },
  { id: 'node-2', port: '3002', color: '\x1b[35m' },
];
const reset = '\x1b[0m';

const children: ChildProcess[] = [];

for (const inst of instances) {
  const child = spawn(
    process.execPath,
    ['--watch', '--loader', 'ts-node/esm', 'src/main.ts'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        INSTANCE_ID: inst.id,
        PORT: inst.port,
        FORCE_COLOR: '1',
      },
    },
  );
  children.push(child);
  console.log(
    `${inst.color}▶ ${inst.id} -> http://localhost:${inst.port}${reset}`,
  );
}

console.log(
  '\nOpen two tabs: http://localhost:3001 and http://localhost:3002 — Ctrl-C to stop.\n',
);

function shutdown() {
  for (const c of children) c.kill('SIGINT');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);