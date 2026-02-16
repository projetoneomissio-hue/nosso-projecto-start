/**
 * CPF Utility Functions
 * Brazilian Individual Taxpayer Registry validation and formatting
 */

/**
 * Format CPF with mask: 000.000.000-00
 */
export function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Remove CPF mask, returning only digits
 */
export function unmaskCPF(cpf: string): string {
    return cpf.replace(/\D/g, "");
}

/**
 * Validate CPF using the Brazilian algorithm
 * Returns true if valid, false if invalid
 */
export function validateCPF(cpf: string): boolean {
    const clean = cpf.replace(/\D/g, "");

    if (clean.length !== 11) return false;

    // Reject all-same-digit CPFs (e.g., 111.111.111-11)
    if (/^(\d)\1{10}$/.test(clean)) return false;

    // First check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(clean.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(clean.charAt(9))) return false;

    // Second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(clean.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(clean.charAt(10))) return false;

    return true;
}
