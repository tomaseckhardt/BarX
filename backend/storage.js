// ===== Persistentní úložiště rezervací =====
// Čtení a zápis reservations.json s ochranou proti souběžným zápisům.

const fs = require('fs');

const { DATA_FILE } = require('./config');

// In-process mutex — brání souběžným zápisům do souboru.
// Node.js je single-threaded, ale async operace mohou prokládat čtení/zápis.
const fileLocks = new Map();

async function withFileLock(fn) {
  // Busy-wait s mikroyieldingem dokud není zámek volný
  while (fileLocks.get('data-file')) {
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  fileLocks.set('data-file', true);
  try {
    return await fn();
  } finally {
    fileLocks.delete('data-file');
  }
}

async function ensureDataFile() {
  try {
    await fs.promises.access(DATA_FILE, fs.constants.F_OK);
  } catch {
    await fs.promises.writeFile(DATA_FILE, '[]\n', 'utf8');
  }
}

async function readReservations() {
  await ensureDataFile();
  const raw = await fs.promises.readFile(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Atomický zápis: nejdřív zapíše do .tmp, pak přejmenuje.
// Přejmenování je na Linuxu atomická operace — soubor nikdy nebude částečně zapsaný.
async function writeReservations(reservations) {
  const tempFile = DATA_FILE + '.tmp';
  const content = JSON.stringify(reservations, null, 2) + '\n';
  try {
    await fs.promises.writeFile(tempFile, content, 'utf8');
    await fs.promises.rename(tempFile, DATA_FILE);
  } catch (error) {
    // Při chybě uklidíme dočasný soubor, aby nezůstal na disku
    try {
      await fs.promises.unlink(tempFile);
    } catch {}
    throw error;
  }
}

module.exports = {
  withFileLock,
  ensureDataFile,
  readReservations,
  writeReservations
};