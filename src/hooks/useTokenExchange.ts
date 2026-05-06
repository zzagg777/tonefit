/**
 * 토큰 교체 훅 (FUNC-NON-09)
 *
 * 회원가입 완료 후 익명 토큰 → 정식 회원 토큰으로 교체하는 비동기 작업을 관리합니다.
 * 이력 이전 실패 시 에러 상태를 반환하고, retry()로 재시도할 수 있습니다.
 *
 * @example
 * const { isLoading, isError, errorMessage, retry } = useTokenExchange();
 *
 * // 회원가입 성공 직후 교체 시작
 * useEffect(() => {
 *   if (signupData) {
 *     retry(); // 또는 초기 실행 시 자동 호출
 *   }
 * }, [signupData]);
 *
 * if (isLoading) return <Spinner />;
 * if (isError) return <ErrorBanner message={errorMessage} onRetry={retry} />;
 */

import { useState, useCallback } from 'react';
import { exchangeToken } from '@/api';

// =============================================================
// 타입
// =============================================================

/** useTokenExchange 훅 반환값 */
export interface UseTokenExchangeReturn {
  /** 토큰 교체 진행 중 여부 */
  isLoading: boolean;
  /** 교체 실패 여부 */
  isError: boolean;
  /** 사용자에게 노출할 에러 메시지 (성공 또는 초기 상태는 null) */
  errorMessage: string | null;
  /**
   * 토큰 교체를 (재)시도합니다.
   *
   * @param accessToken  회원가입/로그인 응답의 access_token
   * @param refreshToken 회원가입/로그인 응답의 refresh_token
   */
  retry: (accessToken: string, refreshToken: string) => Promise<void>;
}

// =============================================================
// 에러 코드 → 사용자 메시지 매핑
// =============================================================

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // 네트워크 단절
    if (error.message === 'Network Error') {
      return '네트워크 연결을 확인한 후 다시 시도해 주세요.';
    }
    // Axios 에러 (status 코드 포함)
    const axiosError = error as Error & {
      response?: { status: number };
    };
    if (axiosError.response?.status === 401) {
      return '세션이 만료되었습니다. 다시 로그인해 주세요.';
    }
    if (axiosError.response?.status === 409) {
      return '이미 처리된 요청입니다. 페이지를 새로고침해 주세요.';
    }
  }
  return '이력 이전 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
};

// =============================================================
// 훅
// =============================================================

/**
 * 익명 토큰 → 정식 회원 토큰 교체 훅
 *
 * 내부적으로 `exchangeToken`을 호출하며,
 * 로딩/에러 상태와 재시도 함수를 제공합니다.
 *
 * @returns {UseTokenExchangeReturn}
 */
const useTokenExchange = (): UseTokenExchangeReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 토큰 교체 실행 (초기 실행 + retry 공용)
   * exchangeToken은 동기 함수이지만, 향후 서버 이력 이전 API가 추가될 경우를 대비해
   * async 래퍼로 감싸 에러 상태를 관리합니다.
   */
  const retry = useCallback(
    async (accessToken: string, refreshToken: string): Promise<void> => {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage(null);

      try {
        // 토큰 교체 실행 (sessionStorage + localStorage + Axios 헤더 갱신)
        exchangeToken(accessToken, refreshToken);
      } catch (error) {
        setIsError(true);
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, isError, errorMessage, retry };
};

export default useTokenExchange;
