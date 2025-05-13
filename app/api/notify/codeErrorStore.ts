import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), 'code_flags.json');

// Инициализация файла хранилища
if (!fs.existsSync(STORAGE_FILE)) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify({ error: {}, success: {} }));
}

// Чтение данных из файла
function readStorage() {
  try {
    const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading storage:', error);
    return { error: {}, success: {} };
  }
}

// Запись данных в файл
function writeStorage(data: any) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing storage:', error);
  }
}

// Функция для нормализации IP адреса
function normalizeIp(ip: string): string {
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return 'localhost';
  }
  return ip.replace(/^::ffff:/, '');
}

export function setCodeErrorFlag(ip: string, hasError: boolean) {
  console.log('Setting code error flag for IP:', ip, 'value:', hasError);
  const normalizedIp = normalizeIp(ip);
  const storage = readStorage();
  storage.error[normalizedIp] = hasError;
  writeStorage(storage);
  console.log('Current error flags:', storage.error);
}

export function getCodeErrorFlag(ip: string): boolean {
  const normalizedIp = normalizeIp(ip);
  const storage = readStorage();
  const hasError = storage.error[normalizedIp] || false;
  console.log('Getting code error flag for IP', normalizedIp, ':', hasError);
  return hasError;
}

export function setCodeSuccessFlag(ip: string, isSuccess: boolean) {
  console.log('Setting code success flag for IP:', ip, 'value:', isSuccess);
  const normalizedIp = normalizeIp(ip);
  const storage = readStorage();
  storage.success[normalizedIp] = isSuccess;
  writeStorage(storage);
  console.log('Current success flags:', storage.success);
}

export function getCodeSuccessFlag(ip: string): boolean {
  const normalizedIp = normalizeIp(ip);
  const storage = readStorage();
  const isSuccess = storage.success[normalizedIp] || false;
  console.log('Getting code success flag for IP', normalizedIp, ':', isSuccess);
  return isSuccess;
}

export function clearCodeFlags(ip: string) {
  const normalizedIp = normalizeIp(ip);
  console.log('Clearing code flags for IP:', normalizedIp);
  const storage = readStorage();
  delete storage.error[normalizedIp];
  delete storage.success[normalizedIp];
  writeStorage(storage);
  console.log('After clearing - Error flags:', storage.error);
  console.log('After clearing - Success flags:', storage.success);
}

// Очистка старых флагов каждые 5 минут
setInterval(() => {
  console.log('Clearing all code flags');
  writeStorage({ error: {}, success: {} });
}, 5 * 60 * 1000); 