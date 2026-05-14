export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** CPF brasileiro: 11 dígitos e dígitos verificadores válidos (rejeita sequências repetidas). */
export function isValidCpf(digits: string): boolean {
  const d = onlyDigits(digits);
  if (d.length !== 11 || !/^\d{11}$/.test(d)) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const nums = d.split("").map(Number);
  let s1 = 0;
  for (let i = 0; i < 9; i++) s1 += nums[i] * (10 - i);
  const r1 = s1 % 11;
  const dv1 = r1 < 2 ? 0 : 11 - r1;
  if (nums[9] !== dv1) return false;
  let s2 = 0;
  for (let i = 0; i < 10; i++) s2 += nums[i] * (11 - i);
  const r2 = s2 % 11;
  const dv2 = r2 < 2 ? 0 : 11 - r2;
  return nums[10] === dv2;
}

export function formatPhoneBr(digits: string): string {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function formatCpf(digits: string): string {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}
