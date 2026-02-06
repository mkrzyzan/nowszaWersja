import { CryptoUtils } from '../src/crypto';
import { encryptJsonWithPassword, decryptJsonWithPassword, type EncryptedEnvelope } from '../src/encryption';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface WalletFileV1 {
  version: 1;
  publicKey: string;
  encryptedPrivateKey: EncryptedEnvelope;
}

interface LegacyWalletFile {
  privateKey: string;
  publicKey: string;
}

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

async function askPassword(question: string): Promise<string> {
  return new Promise(resolve => {
    const rl = readline.createInterface({ 
      input: process.stdin, 
      output: process.stdout,
      terminal: true
    });
    
    // Hide password input by disabling echo
    const stdin = process.stdin as any;
    const wasRaw = stdin.isRaw;
    if (stdin.setRawMode) {
      stdin.setRawMode(true);
    }
    
    process.stdout.write(question + ' ');
    let password = '';
    
    stdin.on('data', (char: Buffer) => {
      const c = char.toString('utf8');
      
      switch (c) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl-D
          stdin.pause();
          if (stdin.setRawMode && wasRaw !== undefined) {
            stdin.setRawMode(wasRaw);
          }
          process.stdout.write('\n');
          rl.close();
          resolve(password);
          break;
        case '\u0003': // Ctrl-C
          process.exit(1);
          break;
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += c;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function getPassphrase(force: boolean): Promise<string> {
  // Check environment variable first
  const envPass = process.env.WALLET_PASSPHRASE;
  if (envPass) {
    return envPass;
  }
  
  // If force mode, require WALLET_PASSPHRASE env var
  if (force) {
    console.error('Error: --force mode requires WALLET_PASSPHRASE environment variable');
    process.exit(1);
  }
  
  // Prompt for passphrase
  return await askPassword('Enter wallet passphrase:');
}

async function isLegacyWalletFile(data: any): Promise<boolean> {
  return data && 
         typeof data.privateKey === 'string' && 
         typeof data.publicKey === 'string' && 
         !data.version;
}

async function isEncryptedWalletFile(data: any): Promise<boolean> {
  return data && 
         data.version === 1 && 
         typeof data.publicKey === 'string' && 
         data.encryptedPrivateKey;
}

async function loadWallet(keyFile: string, passphrase: string, force: boolean): Promise<{ privateKey: string; publicKey: string }> {
  const raw = fs.readFileSync(keyFile, 'utf-8');
  const data = JSON.parse(raw);
  
  // Check if it's a legacy unencrypted wallet
  if (await isLegacyWalletFile(data)) {
    console.log('⚠️  Warning: This wallet file is using the old unencrypted format.');
    
    let shouldMigrate = force;
    if (!force) {
      shouldMigrate = await askYesNo('Would you like to upgrade it to the new encrypted format? (Y/n)');
    }
    
    if (shouldMigrate) {
      const legacy = data as LegacyWalletFile;
      await saveWallet(keyFile, legacy.privateKey, legacy.publicKey, passphrase);
      console.log('✅ Wallet upgraded to encrypted format.');
      return { privateKey: legacy.privateKey, publicKey: legacy.publicKey };
    } else {
      console.log('⚠️  Continuing with unencrypted wallet (not recommended).');
      return data as LegacyWalletFile;
    }
  }
  
  // Check if it's an encrypted wallet
  if (await isEncryptedWalletFile(data)) {
    const wallet = data as WalletFileV1;
    try {
      const decrypted = await decryptJsonWithPassword(wallet.encryptedPrivateKey, passphrase);
      return {
        privateKey: decrypted.privateKey,
        publicKey: wallet.publicKey
      };
    } catch (err) {
      console.error('Failed to decrypt wallet:', err instanceof Error ? err.message : err);
      console.error('Incorrect passphrase or corrupted wallet file.');
      process.exit(1);
    }
  }
  
  throw new Error('Unknown wallet file format');
}

async function saveWallet(keyFile: string, privateKey: string, publicKey: string, passphrase: string): Promise<void> {
  // Encrypt the private key
  const encryptedPrivateKey = await encryptJsonWithPassword({ privateKey }, passphrase);
  
  const walletData: WalletFileV1 = {
    version: 1,
    publicKey,
    encryptedPrivateKey
  };
  
  // Write atomically
  const tmp = keyFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(walletData, null, 2));
  fs.renameSync(tmp, keyFile);
  fs.chmodSync(keyFile, 0o600);
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

  let keyPair: { privateKey: string; publicKey: string };
  
  if (fs.existsSync(keyFile)) {
    try {
      const passphrase = await getPassphrase(force);
      keyPair = await loadWallet(keyFile, passphrase, force);
    } catch (err) {
      console.error('Failed to read existing key file:', err);
      if (!force) {
        const ok = await askYesNo(`The existing key file appears invalid. Regenerate and overwrite ${keyFile}? (Y/n)`);
        if (!ok) {
          console.error('Aborting to avoid key regeneration. Use --force to bypass prompt.');
          process.exit(1);
        }
      }

      const passphrase = await getPassphrase(force);
      keyPair = await CryptoUtils.generateKeyPair();
      try {
        await saveWallet(keyFile, keyPair.privateKey, keyPair.publicKey, passphrase);
        console.log(`Saved new encrypted keypair to ${keyFile}`);
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

    const passphrase = await getPassphrase(force);
    keyPair = await CryptoUtils.generateKeyPair();
    try {
      await saveWallet(keyFile, keyPair.privateKey, keyPair.publicKey, passphrase);
      console.log(`Generated encrypted keypair and saved to ${keyFile}`);
    } catch (e) {
      console.error('Failed to save key file:', e);
      process.exit(1);
    }
  }

  const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
  const timestamp = Date.now();
  const txData = CryptoUtils.getTransactionData(from, to, amount, timestamp);
  const signature = await CryptoUtils.sign(txData, keyPair.privateKey);

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
