/** Reformats a CPF to the `###.###.###-##` pattern the Patient schema stores,
 * regardless of whether the caller sent it with or without punctuation. */
export function normalizeCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}
