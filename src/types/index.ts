/**
 * ToneFit 타입 정의
 *
 * API 명세 v0.2 기준으로 작성된 TypeScript 타입 파일입니다.
 * 백엔드 응답/요청 구조를 타입으로 미리 정의해두면
 * 자동완성이 되고, 오타가 나면 빨간 줄이 생겨서 실수를 줄일 수 있어요.
 */

// =============================================================
// Enum 타입
// 백엔드와 약속된 값 목록 — 임의 문자열 사용 금지!
// =============================================================

/** 수신자 유형 */
export type ReceiverType =
  | 'DIRECT_SUPERVISOR' // 상사
  | 'OTHER_DEPT_COLLEAGUE' // 동료
  | 'EXTERNAL_PARTNER' // 협력사
  | 'CLIENT'; // 고객 & 거래처

/** 이메일 목적 */
export type PurposeType =
  | 'REPORT' // 보고
  | 'REQUEST' // 요청
  | 'NOTICE' // 안내
  | 'THANKS' // 감사
  | 'APOLOGY' // 사과
  | 'COOPERATION' // 협조
  | 'DECLINE'; // 거절

/** 업종 */
export type IndustryType =
  | 'IT'
  | 'MANUFACTURING' // 제조
  | 'FINANCE' // 금융
  | 'PUBLIC' // 공공기관
  | 'SERVICE' // 서비스
  | 'OTHER'; // 기타

/** 회사 규모 */
export type CompanySizeType =
  | 'LARGE' // 대기업
  | 'MEDIUM' // 중견기업
  | 'SMALL' // 중소기업
  | 'STARTUP'; // 스타트업

/** 직급 */
export type JobLevelType =
  | 'INTERN' // 인턴
  | 'STAFF' // 사원
  | 'SENIOR' // 대리
  | 'MANAGER'; // 매니저

/** 연차 */
export type CareerYearType =
  | 'LESS_THAN_1' // 1년 미만
  | 'YEAR_1' // 1년차
  | 'YEAR_2' // 2년차
  | 'YEAR_3' // 3년차
  | 'YEAR_4_OR_MORE'; // 4년 이상

/** 구독 플랜 */
export type PlanType = 'FREE' | 'PRO';

/** 교정 세션 상태 */
export type SessionStatusType =
  | 'DRAFT' // 임시저장
  | 'IN_PROGRESS' // 교정 진행 중
  | 'FAILED' // 실패 (Gemini API 오류 등)
  | 'CONFIRMED'; // 확정 완료 (복사하기 클릭)

/** 교정 피드백 액션 */
export type FeedbackActionType = 'ACCEPTED' | 'REJECTED';

/** 크레딧 거래 타입 */
export type CreditTransactionType = 'PURCHASE' | 'USAGE' | 'REFUND';

/** 결제 상태 */
export type PaymentStatusType = 'PAID' | 'FAILED' | 'REFUNDED';

/**
 * AI 교정 계층 라벨
 * AUTO    → 필수 교정 (문법 오류, 반드시 수정)
 * SUGGEST → 추천 교정 (더 나은 표현 제안)
 * STYLE   → 참고 (스타일 권고, 선택 사항)
 */
export type CorrectionLabelType = 'AUTO' | 'SUGGEST' | 'STYLE';

// =============================================================
// 공통 타입
// =============================================================

/** API 공통 에러 응답 */
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

/**
 * 보호 영역 — 교정에서 제외할 원문 구간
 * 사용자가 드래그로 선택한 영역을 원문 기준 offset으로 표현
 */
export interface ProtectedRange {
  start: number; // 시작 offset
  end: number; // 끝 offset
}

// =============================================================
// 인증 (Auth)
// =============================================================

/** 회원가입 요청 */
export interface SignupRequest {
  email: string;
  password: string; // 8자 이상
  industry: IndustryType;
  company_size: CompanySizeType;
  job_level: JobLevelType;
  career_year: CareerYearType;
}

/** 회원가입 응답 (201) */
export interface SignupResponse {
  user_id: number;
  email: string;
  plan: PlanType;
  access_token: string;
  refresh_token: string;
}

/** 로그인 요청 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 로그인 응답 (200) */
export interface LoginResponse {
  user_id: number;
  email: string;
  plan: PlanType;
  corrections_used_today: number; // 오늘 사용한 무료 교정 횟수
  credit_balance: number;
  access_token: string;
  refresh_token: string;
}

/** 토큰 갱신 요청 */
export interface RefreshRequest {
  refresh_token: string;
}

/** 토큰 갱신 응답 */
export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

/** 로그아웃 요청 */
export interface LogoutRequest {
  refresh_token: string;
}

// =============================================================
// 사용자 (Users)
// =============================================================

/** 내 정보 응답 */
export interface UserProfile {
  user_id: number;
  email: string;
  industry: IndustryType;
  company_size: CompanySizeType;
  job_level: JobLevelType;
  career_year: CareerYearType;
  plan: PlanType;
  free_used: number; // 오늘 사용한 무료 횟수
  credit_balance: number;
  created_at: string; // ISO 8601
}

/** 내 정보 수정 요청 — 변경할 필드만 전송 (PATCH) */
export interface UpdateProfileRequest {
  industry?: IndustryType;
  company_size?: CompanySizeType;
  job_level?: JobLevelType;
  career_year?: CareerYearType;
}

// =============================================================
// 교정 (Corrections)
// =============================================================

/** 교정 개별 항목 */
export interface CorrectionChange {
  index: number; // 0-based 교정 번호
  start: number; // 원문 기준 시작 offset
  end: number; // 원문 기준 끝 offset
  original: string; // 원문 표현
  corrected: string; // 교정된 표현
  reason: string; // 교정 이유 (국립국어원 근거)
  label: CorrectionLabelType; // AUTO | SUGGEST | STYLE
  action: FeedbackActionType | null; // 사용자 응답 (미응답 시 null)
}

/** 임시저장(Draft) 요청 — 모든 필드 선택 */
export interface DraftRequest {
  receiver_type?: ReceiverType;
  purpose?: PurposeType;
  subject?: string;
  original_email?: string;
  context?: string;
}

/** 임시저장 응답 */
export interface DraftResponse {
  session_id: number;
  status: 'DRAFT';
  updated_at: string;
}

/** 임시저장 조회 응답 */
export interface DraftDetailResponse {
  session_id: number;
  receiver_type: ReceiverType;
  purpose: PurposeType;
  subject: string;
  original_email: string;
  context: string;
  updated_at: string;
}

/** 교정 요청 (1차) */
export interface CorrectionRequest {
  receiver_type: ReceiverType;
  purpose: PurposeType;
  subject?: string;
  original_email: string; // 10자 이상, 1500자 이하
  context?: string;
  protected_ranges?: ProtectedRange[];
}

/** 교정 응답 (1차, 201) */
export interface CorrectionResponse {
  session_id: number;
  round: number; // 교정 회차 (1부터 시작)
  corrected_email: string; // 교정된 전체 이메일
  changes: CorrectionChange[];
  created_at: string;
}

/** 재교정 요청 */
export interface RecorrectRequest {
  rejects: Array<{ index: number }>; // 거절할 교정 건 index 목록
}

/** 재교정 응답 */
export interface RecorrectResponse {
  session_id: number;
  round: number;
  remaining_recorrections: number; // 남은 재교정 횟수 (최대 3회)
  changes: CorrectionChange[];
  created_at: string;
}

/** 교정 확정(복사하기) 요청 */
export interface ConfirmRequest {
  final_email: string; // 프론트에서 조립한 최종 이메일 전문
}

/** 교정 확정 응답 */
export interface ConfirmResponse {
  session_id: number;
  copied_at: string;
}

// =============================================================
// 교정 이력 (History)
// =============================================================

/** 세션 목록 아이템 (완료/미완 공통) */
export interface SessionSummary {
  session_id: number;
  receiver_type: ReceiverType;
  purpose: PurposeType;
  subject: string;
  status: SessionStatusType;
  original_preview: string; // 원문 앞 50자
  created_at: string;
}

/** 미완료 이력 목록 응답 (IN_PROGRESS + FAILED) */
export interface InProgressSessionsResponse {
  sessions: SessionSummary[];
}

/** 완료 이력 목록 응답 (CONFIRMED) */
export interface HistoryResponse {
  total: number;
  page: number;
  size: number;
  sessions: SessionSummary[];
}

/** 완료 이력 목록 쿼리 파라미터 */
export interface HistoryParams {
  page?: number;
  size?: number;
  receiver_type?: ReceiverType;
  purpose?: PurposeType;
}

/** 이력 상세 — 라운드별 피드백 */
export interface FeedbackRound {
  round: number;
  original: string;
  corrected: string;
  reason: string;
  action: FeedbackActionType;
}

/** 이력 상세 — 교정 항목 */
export interface FeedbackDetail {
  index: number;
  start: number;
  end: number;
  rounds: FeedbackRound[];
}

/** 이력 상세 응답 */
export interface SessionDetailResponse {
  session_id: number;
  receiver_type: ReceiverType;
  purpose: PurposeType;
  subject: string;
  original_email: string;
  context: string;
  final_email: string;
  status: SessionStatusType;
  total_rounds: number;
  feedbacks: FeedbackDetail[];
  created_at: string;
  copied_at: string;
}

// =============================================================
// 크레딧 & 결제 (Credits & Payments)
// =============================================================

/** 크레딧 거래 내역 아이템 */
export interface CreditTransaction {
  type: CreditTransactionType;
  amount: number; // 양수: 충전, 음수: 사용
  session_id?: number; // USAGE 타입일 때만 존재
  created_at: string;
}

/** 크레딧 잔액 + 거래 내역 응답 */
export interface CreditsResponse {
  credit_balance: number;
  transactions: CreditTransaction[];
}

/** 크레딧 구매 요청 */
export interface PurchaseCreditsRequest {
  amount: number; // 구매할 크레딧 수
  pg_token: string; // PG사 결제 토큰
}

/** 크레딧 구매 응답 (201) */
export interface PurchaseCreditsResponse {
  transaction_id: number;
  type: 'PURCHASE';
  amount: number;
  credit_balance: number; // 구매 후 잔액
  created_at: string;
}

/** 플랜 구독 요청 */
export interface SubscribePlanRequest {
  plan: PlanType;
  pg_token: string;
}

/** 플랜 구독 응답 (201) */
export interface SubscribePlanResponse {
  payment_id: number;
  plan: PlanType;
  amount: number; // 결제 금액 (원) — PRO: 9900
  status: PaymentStatusType;
  created_at: string;
}
