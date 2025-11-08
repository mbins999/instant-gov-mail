import { z } from 'zod';

// قائمة بأشهر كلمات المرور الضعيفة (يجب تجنبها)
const commonPasswords = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'admin123', 'root', 'toor', 'pass', 'test', 'guest', 'info', 'adm'
];

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
  expiryDays: number;
  historyCount: number;
}

export const defaultPasswordPolicy: PasswordPolicyConfig = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  expiryDays: 90,
  historyCount: 5
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(
  password: string,
  userInfo?: { username?: string; fullName?: string; email?: string },
  policy: PasswordPolicyConfig = defaultPasswordPolicy
): PasswordValidationResult {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // 1. طول كلمة المرور
  if (password.length < policy.minLength) {
    errors.push(`كلمة المرور يجب أن تكون ${policy.minLength} حرفاً على الأقل`);
  }

  // 2. حروف كبيرة
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف كبير (A-Z) على الأقل');
  }

  // 3. حروف صغيرة
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف صغير (a-z) على الأقل');
  }

  // 4. أرقام
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رقم (0-9) على الأقل');
  }

  // 5. رموز خاصة
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رمز خاص (!@#$%^&*) على الأقل');
  }

  // 6. منع كلمات المرور الشائعة
  if (policy.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (commonPasswords.some(common => lowerPassword.includes(common))) {
      errors.push('كلمة المرور ضعيفة وسهلة التخمين، يرجى اختيار كلمة مرور أقوى');
    }
  }

  // 7. منع استخدام معلومات المستخدم
  if (policy.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();
    
    if (userInfo.username && lowerPassword.includes(userInfo.username.toLowerCase())) {
      errors.push('كلمة المرور يجب ألا تحتوي على اسم المستخدم');
    }
    
    if (userInfo.fullName) {
      const nameParts = userInfo.fullName.toLowerCase().split(' ');
      if (nameParts.some(part => part.length > 2 && lowerPassword.includes(part))) {
        errors.push('كلمة المرور يجب ألا تحتوي على اسمك');
      }
    }
    
    if (userInfo.email) {
      const emailUsername = userInfo.email.split('@')[0].toLowerCase();
      if (emailUsername.length > 2 && lowerPassword.includes(emailUsername)) {
        errors.push('كلمة المرور يجب ألا تحتوي على بريدك الإلكتروني');
      }
    }
  }

  // حساب قوة كلمة المرور
  let strengthScore = 0;
  
  if (password.length >= policy.minLength) strengthScore += 1;
  if (password.length >= policy.minLength + 4) strengthScore += 1;
  if (/[A-Z]/.test(password)) strengthScore += 1;
  if (/[a-z]/.test(password)) strengthScore += 1;
  if (/[0-9]/.test(password)) strengthScore += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strengthScore += 1;
  if (password.length >= 16) strengthScore += 1;
  
  if (strengthScore <= 3) {
    strength = 'weak';
  } else if (strengthScore <= 5) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

// Zod schema لكلمة المرور
export const passwordSchema = z.string()
  .min(defaultPasswordPolicy.minLength, {
    message: `كلمة المرور يجب أن تكون ${defaultPasswordPolicy.minLength} حرفاً على الأقل`
  })
  .regex(/[A-Z]/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف كبير على الأقل'
  })
  .regex(/[a-z]/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف صغير على الأقل'
  })
  .regex(/[0-9]/, {
    message: 'كلمة المرور يجب أن تحتوي على رقم على الأقل'
  })
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, {
    message: 'كلمة المرور يجب أن تحتوي على رمز خاص على الأقل'
  });

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
  }
}

export function getPasswordStrengthLabel(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'ضعيفة';
    case 'medium':
      return 'متوسطة';
    case 'strong':
      return 'قوية';
  }
}
