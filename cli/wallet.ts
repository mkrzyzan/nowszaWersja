import { CryptoUtils } from '../src/crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

async function askYesNo(question: string): Promise<boolean> {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question + ' ', answer => {
      rl.close();
      const a = (answer || '').trim().toLowerCase();
      resolve(a === '' || a.startsWith('y'));
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const filtered = args.filter(a => a !== '--force');
  const [to, amountArg] = filtered;
  if (!to || !amountArg) {
    console.error('Usage: bun run cli/wallet.ts <toAddress> <amount> [--force]');
    process.exit(1);
  }

  const amount = Number(amountArg);

  const home = process.env.HOME || '.';
  const keyFile = process.env.WALLET_KEY_FILE || path.join(home, '.grosik_wallet.json');

  let keyPair: any;
  if (fs.existsSync(keyFile)) {
    try {
      const raw = fs.readFileSync(keyFile, 'utf-8');
      keyPair = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to read existing key file:', err);
      if (!force) {
        const ok = await askYesNo(`The existing key file appears invalid. Regenerate and overwrite ${keyFile}? (Y/n)`);
        if (!ok) {
          console.error('Aborting to avoid key regeneration. Use --force to bypass prompt.');
          process.exit(1);
        }
      }

      keyPair = CryptoUtils.generateKeyPair();
      try {
        // write atomically
        const tmp = keyFile + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(keyPair));
        fs.renameSync(tmp, keyFile);
        fs.chmodSync(keyFile, 0o600);
        console.log(`Saved new keypair to ${keyFile}`);
      } catch (e) {
        console.error('Failed to save key file:', e);
        process.exit(1);
      }
    }
  } else {
    if (!force) {
      const ok = await askYesNo(`No key file found at ${keyFile}. Create a new keypair? (Y/n)`);
      if (!ok) {
        console.error('Aborting without creating a keypair. Use --force to create automatically.');
        process.exit(1);
      }
    }

    keyPair = CryptoUtils.generateKeyPair();
    try {
      const tmp = keyFile + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(keyPair));
      fs.renameSync(tmp, keyFile);
      fs.chmodSync(keyFile, 0o600);
      console.log(`Generated keypair and saved to ${keyFile}`);
    } catch (e) {
      console.error('Failed to save key file:', e);
      process.exit(1);
    }
  }

  const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
  const timestamp = Date.now();
  const txData = CryptoUtils.getTransactionData(from, to, amount, timestamp);
  const signature = CryptoUtils.sign(txData, keyPair.privateKey);

  const tx = { from, to, amount, timestamp, signature, publicKey: keyPair.publicKey };

  const res = await fetch(process.env.NODE_ENDPOINT || 'http://localhost:3000/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx)
  });

  if (!res.ok) {
    console.error('Failed to send transaction', await res.text());
    process.exit(1);
  }

  console.log('Transaction sent:', tx);
}

main().catch(err => { console.error(err); process.exit(1); });
