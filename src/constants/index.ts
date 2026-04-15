/**
 * ToneFit 상수 정의
 *
 * 앱 전체에서 반복 사용되는 값들을 한 곳에서 관리해요.
 * 상수로 관리하면 오타를 줄이고, 값이 바뀌면 여기만 수정하면 돼요.
 */

import type {
  ReceiverType,
  PurposeType,
  IndustryType,
  CompanySizeType,
  JobLevelType,
  CareerYearType,
  CorrectionLabelType,
} from '@/types';

// =============================================================
// 라우팅 경로
// 문자열 직접 쓰지 말고 이 상수를 사용하세요!
// 예) navigate(ROUTES.CORRECTION) → '/correction'
// =============================================================

export const ROUTES = {
  // 진입점
  HOME: '/', // 랜딩/온보딩

  // 인증
  LOGIN: '/auth', // 로그인

  // 회원가입
  JOIN_ACCEPT: '/join/accept', // 약관 동의
  JOIN_INFO: '/join/info', // 회원 정보 입력
  JOIN_COMPLETE: '/join/complete', // 가입 완료

  // 홈 (로그인 후)
  DASHBOARD: '/home', // 홈화면
  EDITOR: '/home/editor', // 이메일 교정 입력
  EDITOR_PROCESSING: '/home/editor/processing', // 교정 로딩
  EDITOR_RESULT: '/home/editor/result', // 교정 결과 비교

  // 서브 화면
  HISTORY: '/home/history', // 교정 히스토리
  SETTINGS: '/home/settings', // 사용자 설정/프로필
  PRICING: '/home/pricing', // 요금제/결제
} as const;

// =============================================================
// React Query 캐시 키
// 쿼리 키를 상수로 관리하면 invalidateQueries 할 때 실수가 줄어요.
// =============================================================

export const QUERY_KEYS = {
  USER_PROFILE: ['user', 'profile'] as const,
  DRAFT: ['correction', 'draft'] as const,
  CORRECTIONS_IN_PROGRESS: ['corrections', 'in-progress'] as const,
  CORRECTIONS_HISTORY: ['corrections', 'history'] as const,
  CORRECTION_DETAIL: (sessionId: number) =>
    ['corrections', 'detail', sessionId] as const,
  CREDITS: ['credits'] as const,
} as const;

// =============================================================
// 입력 유효성 제한값
// PRD 5.2.4 입력 유효성 검사 기준
// =============================================================

export const INPUT_LIMITS = {
  EMAIL_MIN_LENGTH: 10, // 원문 최소 글자 수
  EMAIL_MAX_LENGTH: 1500, // 원문 최대 글자 수
  PASSWORD_MIN_LENGTH: 8, // 비밀번호 최소 글자 수
} as const;

// =============================================================
// 교정 제한값
// =============================================================

export const CORRECTION_LIMITS = {
  FREE_DAILY_LIMIT: 1, // 무료 플랜 하루 교정 횟수
  MAX_RECORRECTIONS: 3, // 세션당 최대 재교정 횟수
} as const;

// =============================================================
// UI 라벨 매핑
// 백엔드 Enum 값 → 사용자에게 보이는 한국어 라벨
// =============================================================

/** 수신자 유형 한국어 라벨 */
export const RECEIVER_TYPE_LABELS: Record<ReceiverType, string> = {
  DIRECT_SUPERVISOR: '상사',
  OTHER_DEPT_COLLEAGUE: '동료',
  EXTERNAL_PARTNER: '협력사',
  CLIENT: '고객 & 거래처',
};

/** 목적 한국어 라벨 */
export const PURPOSE_LABELS: Record<PurposeType, string> = {
  REPORT: '보고',
  REQUEST: '요청',
  NOTICE: '안내',
  THANKS: '감사',
  APOLOGY: '사과',
  COOPERATION: '협조',
  DECLINE: '거절',
};

/** 업종 한국어 라벨 */
export const INDUSTRY_LABELS: Record<IndustryType, string> = {
  IT: 'IT & 스타트업',
  MANUFACTURING: '제조',
  FINANCE: '금융 & 보험',
  PUBLIC: '공공기관',
  SERVICE: '서비스',
  OTHER: '기타',
};

/** 회사 규모 한국어 라벨 */
export const COMPANY_SIZE_LABELS: Record<CompanySizeType, string> = {
  LARGE: '대기업',
  MEDIUM: '중견기업',
  SMALL: '중소기업',
  STARTUP: '스타트업',
};

/** 직급 한국어 라벨 */
export const JOB_LEVEL_LABELS: Record<JobLevelType, string> = {
  INTERN: '인턴',
  STAFF: '사원',
  SENIOR: '대리',
  MANAGER: '매니저',
};

/** 연차 한국어 라벨 */
export const CAREER_YEAR_LABELS: Record<CareerYearType, string> = {
  LESS_THAN_1: '1년 미만 (신입)',
  YEAR_1: '1년차',
  YEAR_2: '2년차',
  YEAR_3: '3년차',
  YEAR_4_OR_MORE: '4년 이상',
};

/**
 * 교정 계층 라벨 정보
 * label: 사용자에게 보이는 이름
 * description: 설명 문구
 * colorClass: Tailwind 배경색 클래스 (tokens.css 기반)
 */
export const CORRECTION_LABEL_INFO: Record<
  CorrectionLabelType,
  { label: string; description: string; colorClass: string }
> = {
  AUTO: {
    label: '필수 교정',
    description: '문법 오류로 반드시 교정이 필요합니다.',
    colorClass: 'bg-background-danger-subtle text-text-danger',
  },
  SUGGEST: {
    label: '추천 교정',
    description: '수신자와 목적에 더 적절한 표현을 추천합니다.',
    colorClass: 'bg-background-warning-subtle text-text-warning',
  },
  STYLE: {
    label: '참고',
    description: '참고로 알아두시면 좋은 표현입니다.',
    colorClass: 'bg-background-info-subtle text-text-info',
  },
};

// =============================================================
// 에러 메시지
// API 에러 코드 → 사용자에게 보여줄 메시지
// =============================================================

export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_REQUEST: '요청 형식이 올바르지 않습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  EMAIL_ALREADY_EXISTS: '이미 가입된 이메일 주소입니다.',
  TOO_MANY_REQUESTS: '사용 횟수를 초과했습니다.',
  INTERNAL_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  AI_SERVICE_ERROR: 'AI 서비스 오류가 발생했습니다. 다시 시도해주세요.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
} as const;

// =============================================================
// 입력 유효성 에러 메시지
// PRD 5.2.4 기준
// =============================================================

export const VALIDATION_MESSAGES = {
  RECEIVER_REQUIRED: '수신자 유형을 선택해 주세요.',
  PURPOSE_REQUIRED: '이메일 목적을 선택해 주세요.',
  EMAIL_REQUIRED: '교정할 이메일 원문을 붙여넣어 주세요.',
  EMAIL_TOO_SHORT: `교정할 내용이 너무 짧습니다. (최소 ${INPUT_LIMITS.EMAIL_MIN_LENGTH}자)`,
  EMAIL_TOO_LONG: (current: number) =>
    `이메일 원문은 ${INPUT_LIMITS.EMAIL_MAX_LENGTH}자 이내로 입력해 주세요. (현재 ${current}자)`,
  PASSWORD_TOO_SHORT: `비밀번호는 ${INPUT_LIMITS.PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
  EMAIL_INVALID: '올바른 이메일 주소를 입력해 주세요.',
} as const;

// =============================================================
// 로컬 스토리지 키
// localStorage에 저장할 때 키 이름을 상수로 관리
// =============================================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'tf_access_token',
  REFRESH_TOKEN: 'tf_refresh_token',
} as const;
