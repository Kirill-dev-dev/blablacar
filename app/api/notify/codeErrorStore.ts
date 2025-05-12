const codeErrorFlags = new Map<string, boolean>();

export function setCodeErrorFlag(ip: string, val: boolean) {
  console.log(`Setting code error flag for IP ${ip}: ${val}`);
  codeErrorFlags.set(ip, val);
}

export function getCodeErrorFlag(ip: string): boolean {
  const flag = codeErrorFlags.get(ip) || false;
  console.log(`Getting code error flag for IP ${ip}: ${flag}`);
  return flag;
}

// Очистка старых флагов каждые 5 минут
setInterval(() => {
  console.log('Clearing all code error flags');
  codeErrorFlags.clear();
}, 5 * 60 * 1000); 