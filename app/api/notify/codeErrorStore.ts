// Хранилище для флагов ошибок кода
const codeErrorFlags = new Map<string, boolean>();

export function setCodeErrorFlag(userAgent: string, hasError: boolean) {
  console.log('Setting code error flag for User Agent:', userAgent, 'value:', hasError);
  // Нормализуем User Agent
  const normalizedUserAgent = normalizeUserAgent(userAgent);
  codeErrorFlags.set(normalizedUserAgent, hasError);
  console.log('Current flags:', Object.fromEntries(codeErrorFlags));
}

export function getCodeErrorFlag(userAgent: string): boolean {
  // Нормализуем User Agent
  const normalizedUserAgent = normalizeUserAgent(userAgent);
  const hasError = codeErrorFlags.get(normalizedUserAgent) || false;
  console.log('Getting code error flag for User Agent', normalizedUserAgent, ':', hasError);
  return hasError;
}

// Функция для нормализации User Agent
function normalizeUserAgent(userAgent: string): string {
  if (!userAgent || userAgent === 'Unknown') {
    return 'Unknown';
  }
  // Удаляем версии браузеров и оставляем только основную информацию
  return userAgent.replace(/\d+\.\d+(\.\d+)?/g, '').trim();
}

// Функция для очистки флага ошибки
export function clearCodeErrorFlag(userAgent: string) {
  const normalizedUserAgent = normalizeUserAgent(userAgent);
  console.log('Clearing code error flag for User Agent:', normalizedUserAgent);
  codeErrorFlags.delete(normalizedUserAgent);
}

// Очистка старых флагов каждые 5 минут
setInterval(() => {
  console.log('Clearing all code error flags');
  codeErrorFlags.clear();
}, 5 * 60 * 1000); 