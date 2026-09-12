import validator from 'validator';

export function validateEmail(email: string): boolean {
  return validator.isEmail(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeInput(input: string): string {
  return validator.trim(validator.escape(input));
}

export function formatCurrency(cents: number, currency: string = 'CAD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
  }).format(dollars);
}

export function parseCurrency(value: string): number {
  // Remove currency symbols and convert to cents
  const cleaned = value.replace(/[^\d.-]/g, '');
  return Math.round(parseFloat(cleaned) * 100);
}
