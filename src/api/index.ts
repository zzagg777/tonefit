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
// 요청 인터셉터
// 모든 API 요청이 나가기 전에 실행돼요.
// Access Token을 자동으로 헤더에 붙여줍니다.
// =============================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // localStorage에서 Access Token 가져오기
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (accessToken) {
      // Authorization 헤더에 Bearer 토큰 첨부
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================================
// 응답 인터셉터
// 모든 API 응답을 받은 후 실행돼요.
// 401 에러 발생 시 Refresh Token으로 자동 갱신 후 재요청합니다.
// =============================================================

// 토큰 갱신 중 다른 요청이 오면 대기시키기 위한 플래그
let isRefreshing = false;
// 갱신 대기 중인 요청들의 콜백 목록
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * 대기 중인 요청들을 처리하는 함수
 * 토큰 갱신 성공 시 → 새 토큰으로 재요청
 * 토큰 갱신 실패 시 → 에러 반환
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  // 성공 응답은 그대로 반환
  (response) => response,

  // 에러 응답 처리
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 이미 토큰 갱신 중이면 대기열에 추가
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // 토큰 갱신 시작
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        // Refresh Token도 없으면 로그인 페이지로 이동
        processQueue(error, null);
        isRefreshing = false;
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      try {
        // Refresh Token으로 새 Access Token 발급
        const response = await axios.post<RefreshResponse>(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token } = response.data;

        // 새 토큰 저장
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

        // 대기 중이던 요청들 새 토큰으로 재시도
        processQueue(null, access_token);
        isRefreshing = false;

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료 → 로그아웃 처리
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

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
  const response = await apiClient.post<CorrectionResponse>(
    '/corrections',
    data
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
