import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';

import TitleText from '@/components/ui/TitleText';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import Checkbox from '@/components/ui/Checkbox';
import Icon from '@/components/ui/Icon';
import { loginSchema } from '@/schemas/login';
import type { LoginFormValues } from '@/schemas/login';
import { ROUTES } from '@/constants';

/**
 * LoginPage
 * 로그인 폼 페이지입니다.
 *
 * 구성:
 * - TitleText (heading="로그인", variant="lg")
 * - 이메일 입력 필드
 * - 비밀번호 입력 필드 (hide/show 토글 아이콘)
 * - 에러 메시지 영역
 * - 자동 로그인 체크박스 + 아이디찾기·비밀번호 재설정 링크
 * - 로그인 버튼
 * - 회원가입 링크
 */

const LoginPage = () => {
  /** 비밀번호 표시 여부 */
  const [showPassword, setShowPassword] = useState(false);

  /**
   * React Hook Form 초기화
   * zodResolver로 loginSchema 연결
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      autoLogin: false,
    },
  });

  /** API 레벨 에러 메시지 (서버 응답 후 설정) */
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * 폼 제출 핸들러
   *
   * TODO: useLoginMutation (queries/useAuth.ts) 으로 교체
   *       - useMutation({ mutationFn: postLogin })
   *       - onError에서 setApiError 호출
   *       - onSuccess에서 navigate(ROUTES.DASHBOARD)
   */
  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      console.info('[LoginPage] submit', data); // TODO: API 연동 후 제거
      // TODO: const result = await postLogin({ email: data.email, password: data.password });
      // TODO: tokenStore.setTokens(result.accessToken, result.refreshToken);
      // TODO: navigate(ROUTES.DASHBOARD);
    } catch {
      setApiError('아이디 또는 패스워드가 틀렸습니다.');
    }
  };

  /** 필드 에러 또는 API 에러가 있으면 에러 영역 표시 */
  const visibleError =
    apiError ?? errors.email?.message ?? errors.password?.message ?? null;

  return (
    <div className="login max-w-135 w-full flex flex-col gap-10">
      {/* ── 타이틀 영역 ──────────────────────────────────── */}
      <TitleText heading="로그인" />

      {/* ── 폼 ───────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        <TextField
          label="이메일"
          type="email"
          placeholder="이메일을 입력해 주세요"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label="비밀번호"
          type={showPassword ? 'text' : 'password'}
          placeholder="비밀번호를 입력해 주세요"
          rightIcon={showPassword ? 'hide' : 'show'}
          onRightIconClick={() => setShowPassword((p) => !p)}
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {/*
         * 에러 메시지 영역
         * visibleError가 있을 때만 표시 (Figma: 기본 숨김 상태)
         */}
        {visibleError && (
          <div className="flex items-center gap-0.5">
            <Icon
              name="close-circle"
              size={16}
              color="var(--color-text-danger)"
            />
            <span className="text-xs text-text-danger tracking-tight leading-3.5">
              {visibleError}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <Checkbox label="자동 로그인" {...register('autoLogin')} />

          {/* 아이디 찾기 | 비밀번호 재설정 */}
          {/* TODO: 아이디 찾기 / 비밀번호 재설정 경로 ROUTES에 추가 후 교체 */}
          <div className="flex items-center gap-2 text-base text-text-tertiary tracking-tight">
            <button
              type="button"
              className="hover:text-text-secondary transition-colors cursor-pointer"
            >
              아이디찾기
            </button>
            <span aria-hidden="true">|</span>
            <button
              type="button"
              className="hover:text-text-secondary transition-colors cursor-pointer"
            >
              비밀번호 재설정
            </button>
          </div>
        </div>

        {/* 로그인 버튼 */}
        <div className="px-2 pt-5">
          <Button
            type="submit"
            variant={isSubmitting ? 'loading' : 'default'}
            disabled={!isValid}
            className=""
          >
            로그인하기
          </Button>
        </div>
      </form>

      {/* 회원가입 유도 링크 */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-base text-text-tertiary tracking-tight">
          ToneFit이 처음이신가요?
        </span>
        <Link
          to={ROUTES.JOIN_ACCEPT}
          className="text-base text-text-primary font-medium underline underline-offset-2 tracking-tight hover:text-text-brand transition-colors"
        >
          새로 가입하기
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
