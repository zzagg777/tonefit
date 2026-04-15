import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TitleText from '@/components/ui/TitleText';
import Stepper from '@/components/ui/Stepper';
import ButtonGroup from '@/components/ui/ButtonGroup';
import { ROUTES } from '@/constants';

// ── 타입 ──────────────────────────────────────────────────────────

/**
 * 약관 동의 체크 상태
 * - required1: 이용 약관 동의 (필수)
 * - required2: 개인정보 수집 및 이용 동의 (필수)
 * - optional: 이메일 마케팅 정보 수신 동의 (선택)
 */
interface TermsState {
  required1: boolean;
  required2: boolean;
  optional: boolean;
}

/**
 * 약관 목록 항목 단위
 * - key: TermsState와 1:1 매핑
 * - type: '필수' | '선택'
 * - label: 화면에 표시할 약관 이름
 */
interface AgreeTermItem {
  key: keyof TermsState;
  type: '필수' | '선택';
  label: string;
}

// ── 상수 ──────────────────────────────────────────────────────────

/**
 * 약관 동의 항목 목록
 * 렌더링 순서: required1 → required2 → (구분선) → optional
 */
const AGREE_TERMS: AgreeTermItem[] = [
  { key: 'required1', type: '필수', label: '이용 약관 동의' },
  { key: 'required2', type: '필수', label: '개인정보 수집 및 이용 동의' },
  { key: 'optional', type: '선택', label: '이메일 마케팅 정보 수신 동의' },
];

// ── 내부 서브 컴포넌트 ────────────────────────────────────────────

/**
 * CheckBoldIcon
 *
 * 약관 동의 체크 상태를 나타내는 볼드 체크마크 아이콘입니다.
 * Figma 기준: iconamoon:check-bold
 *
 * 색상 규칙:
 * - checked=true  → var(--color-text-primary)  (진한 색)
 * - checked=false → var(--color-text-disabled) (연한 회색)
 */
const CheckBoldIcon = ({ checked }: { checked: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{
      color: checked
        ? 'var(--color-text-primary)'
        : 'var(--color-text-disabled)',
      flexShrink: 0,
    }}
  >
    <path
      d="M4 13L9.5 18.5L20 6"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * ChevronRightIcon
 *
 * 약관 상세 보기 버튼의 오른쪽 화살표 아이콘입니다.
 * Figma 기준: majesticons:dropdown (오른쪽 방향)
 */
const ChevronRightIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M9 18L15 12L9 6"
      stroke="var(--color-icon-tertiary)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── 메인 컴포넌트 ─────────────────────────────────────────────────

/**
 * JoinAcceptPage
 *
 * 회원가입 - 약관 동의 페이지입니다.
 * 경로: /join/accept
 * 디자인 기준: Figma node 654-8809
 *
 * 라우팅 흐름:
 *   이전 → ROUTES.LOGIN  (로그인 화면으로 복귀)
 *   다음 → ROUTES.JOIN_INFO (회원 정보 입력, 필수 약관 모두 동의 시에만 이동)
 *
 * 화면 구성 (위→아래):
 *   1. Header  — 공통 헤더 (로고 + 로그인/회원가입 버튼)
 *   2. main    — 콘텐츠 영역
 *      a. Stepper     — 진행 단계 표시 (step=1: 약관 동의)
 *      b. TitleText   — 페이지 제목 + 안내 문구
 *      c. 약관 동의 영역
 *         - "약관에 모두 동의합니다" 버튼
 *         - 개별 약관 항목 3개 (필수 2 + 선택 1, 구분선으로 분리)
 *      d. ButtonGroup — 이전 / 다음 내비게이션
 *   3. Footer  — 공통 푸터 (저작권 + 링크)
 *
 * 상태 구조:
 *   terms          — 약관별 동의 여부 체크 상태
 *   agreeAll       — 필수 + 선택 전체 동의 여부 (모두 동의 버튼 상태 기준)
 *   canProceed     — 필수 약관(required1 + required2) 모두 동의 여부 (다음 버튼 활성 기준)
 *
 * ButtonGroup 사용 방식:
 *   - canProceed=true  → value='next' → 다음 버튼 primary (진한 배경)
 *   - canProceed=false → value=''    → 양쪽 모두 mute (회색, 비활성 느낌)
 *   - onChange에서 'prev' → LOGIN 이동, 'next' → canProceed 검사 후 JOIN_INFO 이동
 */
const JoinAcceptPage = () => {
  const navigate = useNavigate();

  /**
   * 약관 동의 체크 상태
   * 각 키는 AGREE_TERMS 항목의 key와 일치합니다.
   */
  const [terms, setTerms] = useState<TermsState>({
    required1: false,
    required2: false,
    optional: false,
  });

  /**
   * 필수 약관 전체 동의 여부
   * true → 다음 버튼 활성 / ButtonGroup value='next'
   */
  const canProceed = terms.required1 && terms.required2;

  /**
   * 필수 + 선택 약관 전체 동의 여부
   * true → "약관에 모두 동의합니다" 버튼 체크 상태
   */
  const agreeAll = terms.required1 && terms.required2 && terms.optional;

  /**
   * 모두 동의/해제 핸들러
   * agreeAll 상태를 반전시켜 세 약관을 동시에 변경합니다.
   */
  const handleCheckAll = () => {
    const next = !agreeAll;
    setTerms({ required1: next, required2: next, optional: next });
  };

  /**
   * 개별 약관 토글 핸들러
   * @param key - 변경할 약관 항목의 키
   */
  const handleToggle = (key: keyof TermsState) => {
    setTerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   * 이전/다음 내비게이션 핸들러
   * ButtonGroup의 onChange에서 호출됩니다.
   *
   * - 'prev' → 로그인 페이지로 이동 (항상 가능)
   * - 'next' → 필수 약관 동의 확인 후 회원 정보 페이지로 이동
   *
   * @param val - ButtonGroup이 반환한 option.value ('prev' | 'next')
   */
  const handleNavigation = (val: string) => {
    if (val === 'prev') {
      navigate(ROUTES.LOGIN);
    }
    if (val === 'next' && canProceed) {
      navigate(ROUTES.JOIN_INFO);
    }
  };

  return (
    <div className="join-accept max-w-135 w-full flex flex-col gap-16 items-center">
      {/* ── 진행 단계 표시 ─────────────────────────────────── */}
      {/*
       * step=1: 약관 동의 진행 중
       * Stepper 자체 너비: w-full (부모 max-w-[540px] 기준)
       */}
      <Stepper step={1} />

      {/* ── 페이지 제목 + 안내 문구 ──────────────────────── */}
      {/*
       * heading: Display/L (36px Bold)
       * subtitle: Body/L (16px Regular) — text-text-secondary
       */}
      <TitleText
        heading="약관 동의"
        subtitle="톤핏 서비스 시작 및 가입을 위해 정보 제공에 동의해주세요."
      />

      {/* ── 약관 동의 영역 ─────────────────────────────────── */}
      {/*
       * gap-5: "모두 동의" 버튼과 개별 항목 목록 사이 여백
       */}
      <div className="w-full flex flex-col gap-5">
        {/* ── 모두 동의 버튼 ──────────────────────────────── */}
        {/*
         * - 클릭 시 세 약관 전체 동의/해제 토글
         * - agreeAll: true → 체크 아이콘 진하게 + 텍스트 text-text-primary
         * - agreeAll: false → 체크 아이콘 회색 + 텍스트 text-text-tertiary
         * - 높이: 66px / 모서리: rounded-2xl / 배경: bg-background-muted
         */}

        <button
          type="button"
          onClick={handleCheckAll}
          aria-pressed={agreeAll}
          className="
                w-full h-16.5 rounded-2xl
                bg-background-muted
                flex items-center justify-center gap-2.5
                transition-colors
                relative
                px-5
              "
        >
          {/* 체크마크 아이콘 */}
          <span className="absolute left-5">
            <CheckBoldIcon checked={agreeAll} />
          </span>
          {/*
           * 버튼 텍스트: Heading/M (24px / Bold / 32px line-height)
           * 동의 여부에 따라 글자색 변경
           */}
          <span
            className={`
                  text-2xl font-bold leading-8 tracking-tight
                  ${agreeAll ? 'text-text-primary' : 'text-text-tertiary'}
                `}
          >
            약관에 모두 동의합니다
          </span>
        </button>
        {/* ── 개별 약관 항목 목록 ─────────────────────────── */}
        {/*
         * gap-2.5: 각 약관 항목 행 사이 간격 (Figma 기준)
         */}
        <div className="w-full flex flex-col gap-2.5">
          {AGREE_TERMS.map((term) => (
            <div key={term.key}>
              {/*
               * 필수/선택 구분선
               * optional 항목(선택) 앞에만 렌더링합니다.
               * 필수 약관 2개와 선택 약관 1개를 시각적으로 분리합니다.
               */}
              {term.type === '선택' && (
                <div
                  className="w-full border-t border-border-default mb-2.5"
                  aria-hidden="true"
                />
              )}

              {/*
               * 약관 항목 행
               * - 좌측: [체크 아이콘] + [(필수/선택) 약관명] 클릭 가능
               * - 우측: [상세 보기 화살표] 버튼
               * - 높이: 46px / 좌우 패딩: 20px
               */}
              <div className="flex items-center justify-between h-11.5 px-5 py-2.5">
                {/*
                 * 좌측 - 체크 아이콘 + 약관 라벨 (클릭 시 해당 약관 토글)
                 */}
                <button
                  type="button"
                  onClick={() => handleToggle(term.key)}
                  className="flex items-center gap-2.5 flex-1 text-left"
                  aria-pressed={terms[term.key]}
                  aria-label={`(${term.type}) ${term.label} ${terms[term.key] ? '동의 취소' : '동의'}`}
                >
                  {/* 체크 아이콘: 동의 여부에 따라 색상 변경 */}
                  <CheckBoldIcon checked={terms[term.key]} />

                  {/*
                   * 약관 텍스트: Title/M (18px / SemiBold / 26px line-height)
                   *
                   * (필수)/(선택) 프리픽스
                   *   → text-text-secondary (항상 동일, 항목 식별 목적)
                   *
                   * 약관명
                   *   → 동의: text-text-primary (진하게)
                   *   → 미동의: text-text-disabled (연한 회색)
                   */}
                  <span className="text-lg font-semibold leading-6.5 tracking-tight whitespace-nowrap">
                    <span
                      className={
                        terms[term.key]
                          ? 'text-text-primary'
                          : term.type === '선택'
                            ? 'text-text-disabled'
                            : 'text-text-secondary'
                      }
                    >
                      ({term.type})
                    </span>
                    <span
                      className={
                        terms[term.key]
                          ? 'text-text-primary'
                          : 'text-text-disabled'
                      }
                    >
                      {' '}
                      {term.label}
                    </span>
                  </span>
                </button>

                {/*
                 * 우측 - 상세 보기 버튼 (약관 전문 열기)
                 * TODO: 약관 상세 모달 또는 별도 페이지로 연결
                 */}
                <button
                  type="button"
                  className="shrink-0 ml-2.5"
                  aria-label={`${term.label} 자세히 보기`}
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 이전 / 다음 내비게이션 버튼 ──────────────────── */}
      {/*
       * ButtonGroup 사용 방식:
       *   value=''     (canProceed=false) → 이전·다음 모두 mute (회색)
       *   value='next' (canProceed=true)  → 이전 mute, 다음 primary (진한 배경)
       *
       * onChange:
       *   'prev' → ROUTES.LOGIN 이동 (항상 동작)
       *   'next' → canProceed 확인 후 ROUTES.JOIN_INFO 이동
       */}
      <ButtonGroup
        options={[
          { value: 'prev', label: '이전' },
          { value: 'next', label: '다음' },
        ]}
        value={canProceed ? 'next' : ''}
        onChange={handleNavigation}
        className="w-full"
      />
    </div>
  );
};

export default JoinAcceptPage;
