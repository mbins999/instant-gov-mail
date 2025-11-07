import { supabase } from '@/integrations/supabase/client';

// Password validation
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف كبير');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('يجب أن تحتوي على حرف صغير');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('يجب أن تحتوي على رقم');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('يجب أن تحتوي على رمز خاص (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Rate limiting check
export async function checkRateLimit(
  identifier: string,
  endpoint: string
): Promise<{ allowed: boolean; message?: string }> {
  try {
    const response = await supabase.functions.invoke('rate-limiter', {
      body: { identifier, endpoint }
    });

    if (response.error) {
      console.error('Rate limit check failed:', response.error);
      return { allowed: true }; // Allow on error
    }

    return {
      allowed: response.data?.allowed || false,
      message: response.data?.message
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true }; // Allow on error
  }
}

// Get user IP (best effort)
export async function getUserIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim();
}

// Validate file upload
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مسموح' };
  }

  return { valid: true };
}

// Create secure session token
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}