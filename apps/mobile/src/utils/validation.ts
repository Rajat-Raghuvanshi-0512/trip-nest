import { z } from 'zod';
import { VALIDATION_RULES } from './constants';

// Login validation schema
export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'Email or username is required')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Register validation schema
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email(VALIDATION_RULES.EMAIL.MESSAGE)
    .trim()
    .toLowerCase(),
  username: z
    .string()
    .min(VALIDATION_RULES.USERNAME.MIN_LENGTH, `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.USERNAME.MAX_LENGTH, `Username must not exceed ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`)
    .regex(VALIDATION_RULES.USERNAME.PATTERN, VALIDATION_RULES.USERNAME.MESSAGE)
    .trim(),
  password: z
    .string()
    .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.PASSWORD.MAX_LENGTH, `Password must not exceed ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`)
    .regex(VALIDATION_RULES.PASSWORD.PATTERN, VALIDATION_RULES.PASSWORD.MESSAGE),
  firstName: z
    .string()
    .min(VALIDATION_RULES.NAME.MIN_LENGTH, VALIDATION_RULES.NAME.MESSAGE)
    .max(VALIDATION_RULES.NAME.MAX_LENGTH, VALIDATION_RULES.NAME.MESSAGE)
    .trim(),
  lastName: z
    .string()
    .min(VALIDATION_RULES.NAME.MIN_LENGTH, VALIDATION_RULES.NAME.MESSAGE)
    .max(VALIDATION_RULES.NAME.MAX_LENGTH, VALIDATION_RULES.NAME.MESSAGE)
    .trim(),
});

// Password confirmation schema for register
export const registerWithConfirmSchema = registerSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type RegisterWithConfirmFormData = z.infer<typeof registerWithConfirmSchema>;

// Validation helpers
export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL.PATTERN.test(email);
};

export const validatePassword = (password: string): boolean => {
  return (
    password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH &&
    password.length <= VALIDATION_RULES.PASSWORD.MAX_LENGTH &&
    VALIDATION_RULES.PASSWORD.PATTERN.test(password)
  );
};

export const validateUsername = (username: string): boolean => {
  return (
    username.length >= VALIDATION_RULES.USERNAME.MIN_LENGTH &&
    username.length <= VALIDATION_RULES.USERNAME.MAX_LENGTH &&
    VALIDATION_RULES.USERNAME.PATTERN.test(username)
  );
}; 