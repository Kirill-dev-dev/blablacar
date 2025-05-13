// Хранилище для флагов ошибок и успеха кода
const codeErrorFlags = new Map<string, boolean>();
const codeSuccessFlags = new Map<string, boolean>();

export function setCodeErrorFlag(ip: string, hasError: boolean) {
  console.log('Setting code error flag for IP:', ip, 'value:', hasError);
  // Нормализуем IP адрес
  const normalizedIp = normalizeIp(ip);
  codeErrorFlags.set(normalizedIp, hasError);
  console.log('Current error flags:', Object.fromEntries(codeErrorFlags));
}

export function getCodeErrorFlag(ip: string): boolean {
  // Нормализуем IP адрес
  const normalizedIp = normalizeIp(ip);
  const hasError = codeErrorFlags.get(normalizedIp) || false;
  console.log('Getting code error flag for IP', normalizedIp, ':', hasError);
  return hasError;
}

export function setCodeSuccessFlag(ip: string, isSuccess: boolean) {
  console.log('Setting code success flag for IP:', ip, 'value:', isSuccess);
  // Нормализуем IP адрес
  const normalizedIp = normalizeIp(ip);
  codeSuccessFlags.set(normalizedIp, isSuccess);
  console.log('Current success flags:', Object.fromEntries(codeSuccessFlags));
}

export function getCodeSuccessFlag(ip: string): boolean {
  // Нормализуем IP адрес
  const normalizedIp = normalizeIp(ip);
  const isSuccess = codeSuccessFlags.get(normalizedIp) || false;
  console.log('Getting code success flag for IP', normalizedIp, ':', isSuccess);
  return isSuccess;
}

// Функция для нормализации IP адреса
function normalizeIp(ip: string): string {
  // Если это localhost или IPv6 localhost, возвращаем 'localhost'
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return 'localhost';
  }
  
  // Удаляем IPv6 префикс если есть
  return ip.replace(/^::ffff:/, '');
}

// Функция для очистки флагов
export function clearCodeFlags(ip: string) {
  const normalizedIp = normalizeIp(ip);
  console.log('Clearing code flags for IP:', normalizedIp);
  codeErrorFlags.delete(normalizedIp);
  codeSuccessFlags.delete(normalizedIp);
}

// Очистка старых флагов каждые 5 минут
setInterval(() => {
  console.log('Clearing all code flags');
  codeErrorFlags.clear();
  codeSuccessFlags.clear();
}, 5 * 60 * 1000); 