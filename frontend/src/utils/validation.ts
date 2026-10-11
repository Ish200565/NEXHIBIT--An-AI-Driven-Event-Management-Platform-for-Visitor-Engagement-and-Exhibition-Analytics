// Small, reusable form-check helpers. Used by Register and Login.

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

// Allows digits, spaces, + ( ) and -, with 7 to 15 digits in total.
export function isValidPhone(value: string): boolean {
  const text = value.trim()
  if (!/^[+\d\s()-]+$/.test(text)) return false
  const digits = text.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

// Lets people type "www.company.com" without "https://".
export function normaliseWebsite(value: string): string {
  const text = value.trim()
  if (text === '') return ''
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}

export function isValidWebsite(value: string): boolean {
  try {
    const url = new URL(normaliseWebsite(value))
    return url.hostname.includes('.')
  } catch {
    return false
  }
}

// Returns a message if the password is too weak, or null if it is fine.
export function getPasswordProblem(value: string): string | null {
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Include at least one letter and one number.'
  }
  return null
}