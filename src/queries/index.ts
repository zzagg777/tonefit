/**
 * ToneFit TanStack Query 훅 모음
 *
 * useQuery  → 데이터 조회 (GET) — 캐싱, 자동 갱신 처리
 * useMutation → 데이터 변경 (POST/PUT/PATCH) — 성공 시 캐시 무효화
 *
 * QUERY_KEYS로 캐시를 관리하기 때문에
 * 같은 키의 데이터가 바뀌면 관련 컴포넌트가 자동으로 리렌더링돼요.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import type { HistoryParams, UpdateProfileRequest } from '@/types';
import {
  // Users
  getMyProfile,
  updateMyProfile,
  // Corrections
  saveDraft,
  getDraft,
  requestCorrection,
  retryCorrection,
  recorrect,
  confirmCorrection,
  // History
  getInProgressSessions,
  getHistory,
  getSessionDetail,
  // Credits
  getCredits,
  purchaseCredits,
  subscribePlan,
} from '@/api';
import type {
  DraftRequest,
  CorrectionRequest,
  RecorrectRequest,
  ConfirmRequest,
  PurchaseCreditsRequest,
  SubscribePlanRequest,
} from '@/types';

// =============================================================
// 사용자 (Users)
// =============================================================

/**
 * 내 프로필 조회
 *
 * 사용 예시:
 * const { data, isLoading } = useMyProfile();
 * data?.plan       // 'FREE' | 'PRO'
 * data?.free_used  // 오늘 사용한 무료 횟수
 */
export const useMyProfile = () => {
  return useQuery({
    queryKey: QUERY_KEYS.USER_PROFILE,
    queryFn: getMyProfile,
    // 로그인 상태에서만 조회 (토큰이 있을 때만)
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지 (불필요한 재요청 방지)
  });
};

/**
 * 내 프로필 수정
 * 성공 시 프로필 캐시 자동 갱신
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateMyProfile(data),
    onSuccess: () => {
      // 프로필 캐시 무효화 → 자동으로 최신 데이터 재요청
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
    },
  });
};

// =============================================================
// 임시저장 (Draft)
// =============================================================

/**
 * 임시저장 조회
 * 교정 입력 화면 진입 시 이전에 작성 중이던 내용 불러오기
 */
export const useDraft = () => {
  return useQuery({
    queryKey: QUERY_KEYS.DRAFT,
    queryFn: getDraft,
    // 404 에러(draft 없음)는 에러로 처리하지 않음
    retry: false,
  });
};

/**
 * 임시저장 저장
 * 작성 중 자동저장 or 수동저장에 사용
 */
export const useSaveDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DraftRequest) => saveDraft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DRAFT });
    },
  });
};

// =============================================================
// 교정 (Corrections)
// =============================================================

/**
 * 1차 교정 요청
 * 성공 시 미완료 이력 캐시 무효화 (새 세션이 생겼으므로)
 */
export const useRequestCorrection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CorrectionRequest) => requestCorrection(data),
    onSuccess: () => {
      // 미완료 이력에 새 세션이 추가됐으므로 캐시 갱신
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CORRECTIONS_IN_PROGRESS,
      });
      // Draft도 초기화
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DRAFT });
    },
  });
};

/**
 * FAILED 세션 재시도
 * Gemini API 실패 후 다시 시도 — 과금 없음
 */
export const useRetryCorrection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) => retryCorrection(sessionId),
    onSuccess: (_, sessionId) => {
      // 해당 세션 상세 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CORRECTION_DETAIL(sessionId),
      });
    },
  });
};

/**
 * 재교정 요청
 * reject한 교정 건에 대해 다시 교정 요청 (최대 3회)
 */
export const useRecorrect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: number;
      data: RecorrectRequest;
    }) => recorrect(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CORRECTION_DETAIL(sessionId),
      });
    },
  });
};

/**
 * 교정 확정 (복사하기)
 * 성공 시:
 * - 완료 이력 캐시 갱신 (새 CONFIRMED 세션 추가)
 * - 미완료 이력 캐시 갱신 (해당 세션 제거)
 * - 프로필 캐시 갱신 (free_used or credit_balance 차감)
 */
export const useConfirmCorrection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: number;
      data: ConfirmRequest;
    }) => confirmCorrection(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CORRECTIONS_HISTORY,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CORRECTIONS_IN_PROGRESS,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CORRECTION_DETAIL(sessionId),
      });
      // 사용 횟수 or 크레딧 차감됐으므로 프로필도 갱신
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
    },
  });
};

// =============================================================
// 교정 이력 (History)
// =============================================================

/**
 * 미완료 이력 조회 (IN_PROGRESS + FAILED)
 * 교정 결과 화면에서 이전에 완료 안 된 세션 확인용
 */
export const useInProgressSessions = () => {
  return useQuery({
    queryKey: QUERY_KEYS.CORRECTIONS_IN_PROGRESS,
    queryFn: getInProgressSessions,
  });
};

/**
 * 완료 이력 조회 (CONFIRMED)
 * 페이지네이션 + 필터 지원
 *
 * 사용 예시:
 * const { data } = useHistory({ page: 1, size: 10, receiver_type: 'CLIENT' });
 * data?.total    // 전체 개수
 * data?.sessions // 현재 페이지 세션 목록
 */
export const useHistory = (params?: HistoryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.CORRECTIONS_HISTORY, params],
    queryFn: () => getHistory(params),
    // 페이지 전환 시 이전 데이터 유지 (깜빡임 방지)
    placeholderData: keepPreviousData,
  });
};

/**
 * 교정 이력 상세 조회
 * 세션 ID로 특정 교정의 전체 내용 조회
 */
export const useSessionDetail = (sessionId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.CORRECTION_DETAIL(sessionId),
    queryFn: () => getSessionDetail(sessionId),
    enabled: !!sessionId, // sessionId가 있을 때만 요청
  });
};

// =============================================================
// 크레딧 & 결제 (Credits & Payments)
// =============================================================

/**
 * 크레딧 잔액 + 거래 내역 조회
 *
 * 사용 예시:
 * const { data } = useCredits();
 * data?.credit_balance  // 잔액
 * data?.transactions    // 거래 내역 배열
 */
export const useCredits = () => {
  return useQuery({
    queryKey: QUERY_KEYS.CREDITS,
    queryFn: getCredits,
  });
};

/**
 * 크레딧 구매
 * 성공 시 크레딧 잔액 + 프로필 캐시 갱신
 * (프로필에도 credit_balance가 포함되어 있어서 둘 다 갱신)
 */
export const usePurchaseCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PurchaseCreditsRequest) => purchaseCredits(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CREDITS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
    },
  });
};

/**
 * PRO 플랜 구독
 * 성공 시 프로필 캐시 갱신 (plan: FREE → PRO 변경)
 */
export const useSubscribePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubscribePlanRequest) => subscribePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
    },
  });
};
