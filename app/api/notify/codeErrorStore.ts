// Хранилище для флагов ошибок кода
const codeErrorFlags = new Map<string, boolean>();

export function setCodeErrorFlag(ip: string, hasError: boolean) {
  console.log('Setting code error flag for IP:', ip, 'value:', hasError);
  // Нормализуем IP адрес
  const normalizedIp = normalizeIp(ip);
  codeErrorFlags.set(normalizedIp, hasError);
  console.log('Current flags:', Object.fromEntries(codeErrorFlags));
}

export function getCodeErrorFlag(ip: string): boolean {
  // Нормализуем IP адрес
  const normalizedIp = normalizeIp(ip);
  const hasError = codeErrorFlags.get(normalizedIp) || false;
  console.log('Getting code error flag for IP', normalizedIp, ':', hasError);
  return hasError;
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

// Функция для очистки флага ошибки
export function clearCodeErrorFlag(ip: string) {
  const normalizedIp = normalizeIp(ip);
  console.log('Clearing code error flag for IP:', normalizedIp);
  codeErrorFlags.delete(normalizedIp);
}

// Очистка старых флагов каждые 5 минут
setInterval(() => {
  console.log('Clearing all code error flags');
  codeErrorFlags.clear();
}, 5 * 60 * 1000); 