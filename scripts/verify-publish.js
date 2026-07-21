/**
 * Publish gate: refuses to publish when the compiled plugin output is
 * missing. The Medusa CLI can exit 0 even when `plugin:build` fails
 * (e.g. when a broken globally-installed CLI is picked up), which would
 * otherwise let `npm publish` ship a tarball with no code in it — the
 * `files` field only includes `.medusa/server/**`.
 */
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const serverDir = join(__dirname, '..', '.medusa', 'server');
const requiredFiles = [
  join(serverDir, 'src', 'index.js'),
  join(serverDir, 'src', 'index.d.ts'),
  join(serverDir, 'src', 'providers', 'easypayment-braintree', 'index.js'),
];

const missing = requiredFiles.filter((file) => !existsSync(file));

if (missing.length > 0) {
  console.error('✖ Publish blocked: the plugin build output is missing or incomplete.');
  for (const file of missing) {
    console.error(`  missing: ${file}`);
  }
  console.error('');
  console.error('Run "npm install" and then "npm run build" in the project folder,');
  console.error('confirm ".medusa/server" exists, and try publishing again.');
  process.exit(1);
}

console.log('✔ Plugin build output verified — tarball will contain the compiled plugin.');
