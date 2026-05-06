/**
 * ToneFit API 클라이언트
 *
 * Axios 인스턴스를 생성하고 인터셉터를 설정합니다.
 *
 * 인터셉터란?
 * → 요청/응답이 오갈 때 중간에서 가로채서 공통 처리를 해주는 미들웨어예요.
 * → 예) 모든 요청에 토큰 자동 첨부, 401 에러 시 자동 토큰 갱신
 */

import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '@/constants';
import type {
  // Auth
  AnonymousSession,
  AnonymousTokenResponse,
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
  // Users
  UserProfile,
  UpdateProfileRequest,
  // Corrections
  DraftRequest,
  DraftResponse,
  DraftDetailResponse,
  CorrectionRequest,
  CorrectionResponse,
  RecorrectRequest,
  RecorrectResponse,
  RejectRequest,
  RejectResponse,
  FinalizeResponse,
  EditRequest,
  EditResponse,
  ConfirmRequest,
  ConfirmResponse,
  // History
  InProgressSessionsResponse,
  HistoryResponse,
  HistoryParams,
  SessionDetailResponse,
  // Credits & Payments
  CreditsResponse,
  PurchaseCreditsRequest,
  PurchaseCreditsResponse,
  SubscribePlanRequest,
  SubscribePlanResponse,
} from '@/types';

// =============================================================
// Axios 인스턴스 생성
// =============================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // .env의 VITE_API_URL 사용
  timeout: 15000, // 15초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================
// 요청 인터셉터 (FUNC-NON-03)
// 모든 API 요청이 나가기 전에 실행돼요.
// sessionStorage의 Access Token을 자동으로 헤더에 붙여줍니다.
// =============================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // sessionStorage에서 Access Token 읽기
    // (익명/정식 회원 공용 — 탭 닫으면 자동 만료)
    const accessToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // TODO: 임시 로그 — API 테스트 확인 후 제거
    console.log(
      `[REQ] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      config.data ?? ''
    );

    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================================
// 응답 인터셉터 (FUNC-NON-04, 05, 06)
// - 401: refreshToken으로 자동 갱신 후 재요청 (FUNC-NON-04)
// - 401/403 갱신 실패: 토큰 전부 삭제 + 초기 상태 리셋 (FUNC-NON-06)
// - 429: IP 차단 안내용 에러 throw (FUNC-NON-05)
// - 중복 갱신 방지: 갱신 중 요청은 큐에 쌓아 순서대로 처리 (FUNC-NON-04)
// =============================================================

/** 토큰 갱신 진행 중 여부 플래그 */
let isRefreshing = false;

/**
 * 갱신 대기 중인 요청 콜백 큐
 * 갱신 완료 후 저장된 순서대로 재처리합니다.
 */
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * 대기 큐를 처리하는 내부 헬퍼
 * @param error  갱신 실패 시 전달할 에러 (성공 시 null)
 * @param token  갱신 성공 시 전달할 새 accessToken (실패 시 null)
 */
const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * 모든 토큰을 삭제하고 세션을 초기화합니다. (FUNC-NON-06)
 * Refresh Token 만료 또는 401/403 갱신 실패 시 호출됩니다.
 */
const clearAllTokens = (): void => {
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

apiClient.interceptors.response.use(
  // 성공 응답: { success, data, error } 래퍼 자동 unwrap
  (response) => {
    // 백엔드가 { success: true, data: {...}, error: null } 형태로 감싸는 경우 내부 data만 꺼냄
    if (
      response.data !== null &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }

    // TODO: 임시 로그 — API 테스트 확인 후 제거
    console.log(
      `[RES] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
      response.data
    );
    return response;
  },

  // 에러 응답 처리
  async (error) => {
    const originalRequest = error.config;
    const status: number | undefined = error.response?.status;

    // TODO: 임시 로그 — API 테스트 확인 후 제거
    console.error(
      `[ERR] ${status ?? 'NETWORK'} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
      error.response?.data ?? error.message
    );

    // ── 429 Too Many Requests (FUNC-NON-05) ──
    // IP 차단 안내를 위해 그대로 throw — 호출부에서 처리
    if (status === 429) {
      return Promise.reject(error);
    }

    // ── 401 Unauthorized ──
    // 아직 재시도하지 않은 요청에 한해 토큰 갱신 시도 (FUNC-NON-04)
    if (status === 401 && !originalRequest._retry) {
      // 이미 갱신 중이면 큐에 추가하고 대기 (중복 갱신 방지)
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem(
        STORAGE_KEYS.REFRESH_TOKEN
      );

      // refreshToken 없음 → 세션 초기화 후 온보딩으로 이동
      if (!storedRefreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        clearAllTokens();
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        // refreshToken으로 새 accessToken 발급
        const response = await axios.post<RefreshResponse>(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refresh_token: storedRefreshToken }
        );

        const { access_token, refresh_token } = response.data;

        // 새 토큰 저장 (accessToken → sessionStorage, refreshToken → localStorage)
        sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

        // 대기 중이던 요청들 순서대로 재처리
        processQueue(null, access_token);
        isRefreshing = false;

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // refreshToken도 만료/무효 → 전체 세션 초기화 (FUNC-NON-06)
        processQueue(refreshError, null);
        isRefreshing = false;
        clearAllTokens();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    // ── 403 Forbidden ──
    // 세션 타입 불일치(만료된 익명 세션 등) → 초기화 (FUNC-NON-06)
    if (status === 403) {
      clearAllTokens();
      window.location.href = '/';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// =============================================================
// 0. 익명 세션 API (Anonymous Session)
// =============================================================

/**
 * 익명 토큰 발급 (FUNC-NON-02)
 *
 * 앱 최초 진입 시 호출합니다.
 * 서버에서 임시 anonymousId + 토큰 쌍을 발급받아 저장합니다.
 *
 * 저장 전략:
 * - accessToken  → sessionStorage (탭/브라우저 닫으면 자동 만료)
 * - refreshToken → localStorage   (30일 유지)
 *
 * @returns 발급된 익명 세션 정보
 * @throws 네트워크 오류 또는 서버 오류 시 에러 throw — 호출부에서 핸들링
 *
 * @example
 * try {
 *   const session = await issueAnonymousToken();
 *   // 이후 apiClient 요청에 자동으로 토큰 첨부됨
 * } catch (error) {
 *   // 오프라인 등 발급 실패 처리
 * }
 */
export const issueAnonymousToken = async (): Promise<AnonymousSession> => {
  // apiClient 사용 → 응답 인터셉터의 { success, data, error } unwrap 자동 적용
  const response =
    await apiClient.post<AnonymousTokenResponse>('/auth/anonymous');

  const {
    user_id,
    is_guest,
    plan,
    anonymous_token,
    access_token,
    refresh_token,
  } = response.data;

  const session: AnonymousSession = {
    userId: user_id,
    isGuest: is_guest,
    plan,
    anonymousToken: anonymous_token,
    accessToken: access_token,
    refreshToken: refresh_token,
  };

  // 토큰 저장 (토큰 값은 로그로 노출하지 않음)
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken);
  localStorage.setItem(STORAGE_KEYS.ANON_TOKEN, session.anonymousToken);

  return session;
};

/**
 * 회원 가입 후 익명 토큰 → 정식 회원 토큰으로 교체 (FUNC-NON-08)
 *
 * 회원가입 또는 로그인 성공 직후 호출합니다.
 * 기존 익명 토큰을 모두 삭제하고, 정식 회원 토큰으로 교체합니다.
 *
 * @param accessToken  회원가입/로그인 응답의 access_token
 * @param refreshToken 회원가입/로그인 응답의 refresh_token
 *
 * @example
 * const data = await signup(formData);
 * exchangeToken(data.access_token, data.refresh_token);
 * navigate(ROUTES.DASHBOARD);
 */
export const exchangeToken = (
  accessToken: string,
  refreshToken: string
): void => {
  // 기존 익명 토큰 전부 삭제
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

  // 정식 회원 토큰 저장
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

  // Axios 인스턴스 기본 헤더 즉시 반영
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
};

// =============================================================
// 1. 인증 API (Auth)
// =============================================================

/** 회원가입 */
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<SignupResponse>('/auth/signup', data);
  return response.data;
};

/** 로그인 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
};

/** 토큰 갱신 */
export const refreshToken = async (
  data: RefreshRequest
): Promise<RefreshResponse> => {
  const response = await apiClient.post<RefreshResponse>('/auth/refresh', data);
  return response.data;
};

/** 로그아웃 */
export const logout = async (data: LogoutRequest): Promise<void> => {
  await apiClient.post('/auth/logout', data);
};

// =============================================================
// 2. 사용자 API (Users)
// =============================================================

/** 내 정보 조회 */
export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/users/me');
  return response.data;
};

/** 내 정보 수정 */
export const updateMyProfile = async (
  data: UpdateProfileRequest
): Promise<UserProfile> => {
  const response = await apiClient.patch<UserProfile>('/users/me', data);
  return response.data;
};

// =============================================================
// 3. 교정 API (Corrections)
// =============================================================

/** 임시저장 (Draft) — 사용자당 1건 유지, PUT으로 덮어쓰기 */
export const saveDraft = async (data: DraftRequest): Promise<DraftResponse> => {
  const response = await apiClient.put<DraftResponse>(
    '/corrections/draft',
    data
  );
  return response.data;
};

/** 임시저장 조회 */
export const getDraft = async (): Promise<DraftDetailResponse> => {
  const response =
    await apiClient.get<DraftDetailResponse>('/corrections/draft');
  return response.data;
};

/** 교정 요청 (1차) */
export const requestCorrection = async (
  data: CorrectionRequest
): Promise<CorrectionResponse> => {
  // Gemini AI 교정 처리 → 60초로 연장
  const response = await apiClient.post<CorrectionResponse>(
    '/corrections',
    data,
    { timeout: 60000 }
  );
  return response.data;
};

/**
 * FAILED 세션 재시도
 * Gemini API 실패 후 동일 입력으로 재시도 — 과금 없음
 */
export const retryCorrection = async (
  sessionId: number
): Promise<CorrectionResponse> => {
  const response = await apiClient.post<CorrectionResponse>(
    `/corrections/${sessionId}/retry`
  );
  return response.data;
};

/** 재교정 요청 */
export const recorrect = async (
  sessionId: number,
  data: RecorrectRequest
): Promise<RecorrectResponse> => {
  const response = await apiClient.post<RecorrectResponse>(
    `/corrections/${sessionId}/recorrect`,
    data
  );
  return response.data;
};

/**
 * 교정 거부 (사유 포함)
 * 특정 교정 건을 거부하고 사유를 함께 기록합니다. action = REJECTED 즉시 반영.
 */
export const rejectCorrection = async (
  sessionId: number,
  data: RejectRequest
): Promise<RejectResponse> => {
  const response = await apiClient.post<RejectResponse>(
    `/corrections/${sessionId}/reject`,
    data
  );
  return response.data;
};

/**
 * 최종 다듬기
 * 거절된 원문 + 수락된 교정문을 고정하여 다듬기. AI 추천 제목 함께 생성.
 * Request Body 없음.
 */
export const finalizeCorrection = async (
  sessionId: number
): Promise<FinalizeResponse> => {
  // AI 최종본 생성(ai_final, ai_subject)이 포함되어 시간이 오래 걸릴 수 있음 → 60초로 연장
  const response = await apiClient.post<FinalizeResponse>(
    `/corrections/${sessionId}/finalize`,
    undefined,
    { timeout: 60000 }
  );
  return response.data;
};

/**
 * 사용자 편집 저장
 * 사용자가 편집한 본문/제목을 저장합니다. 변경할 필드만 전송.
 */
export const editCorrection = async (
  sessionId: number,
  data: EditRequest
): Promise<EditResponse> => {
  const response = await apiClient.patch<EditResponse>(
    `/corrections/${sessionId}/edit`,
    data
  );
  return response.data;
};

/** 교정 확정 (복사하기) */
export const confirmCorrection = async (
  sessionId: number,
  data: ConfirmRequest
): Promise<ConfirmResponse> => {
  const response = await apiClient.post<ConfirmResponse>(
    `/corrections/${sessionId}/confirm`,
    data
  );
  return response.data;
};

// =============================================================
// 4. 교정 이력 API (History)
// =============================================================

/** 미완료 이력 조회 (IN_PROGRESS + FAILED) */
export const getInProgressSessions =
  async (): Promise<InProgressSessionsResponse> => {
    const response = await apiClient.get<InProgressSessionsResponse>(
      '/corrections/in-progress'
    );
    return response.data;
  };

/** 완료 이력 조회 (CONFIRMED) */
export const getHistory = async (
  params?: HistoryParams
): Promise<HistoryResponse> => {
  const response = await apiClient.get<HistoryResponse>(
    '/corrections/history',
    {
      params,
    }
  );
  return response.data;
};

/** 교정 이력 상세 조회 */
export const getSessionDetail = async (
  sessionId: number
): Promise<SessionDetailResponse> => {
  const response = await apiClient.get<SessionDetailResponse>(
    `/corrections/${sessionId}`
  );
  return response.data;
};

// =============================================================
// 5. 크레딧 & 결제 API (Credits & Payments)
// =============================================================

/** 크레딧 잔액 + 거래 내역 조회 */
export const getCredits = async (): Promise<CreditsResponse> => {
  const response = await apiClient.get<CreditsResponse>('/credits');
  return response.data;
};

/** 크레딧 구매 */
export const purchaseCredits = async (
  data: PurchaseCreditsRequest
): Promise<PurchaseCreditsResponse> => {
  const response = await apiClient.post<PurchaseCreditsResponse>(
    '/credits/purchase',
    data
  );
  return response.data;
};

/** PRO 플랜 구독 */
export const subscribePlan = async (
  data: SubscribePlanRequest
): Promise<SubscribePlanResponse> => {
  const response = await apiClient.post<SubscribePlanResponse>(
    '/payments/subscribe',
    data
  );
  return response.data;
};

export default apiClient;
