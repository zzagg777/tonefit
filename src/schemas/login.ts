import { z } from 'zod';
import { VALIDATION_MESSAGES } from '@/constants';

/**
 * 로그인 폼 유효성 스키마
 *
 * 필드:
 * - email   : 이메일 형식 검사
 * - password: 8자 이상
 * - autoLogin: 자동 로그인 여부 (체크박스, 기본값 false는 폼 defaultValues)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해 주세요.')
    .email(VALIDATION_MESSAGES.EMAIL_INVALID),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
  autoLogin: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
