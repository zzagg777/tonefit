import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import TitleText from '@/components/ui/TitleText';
import Stepper from '@/components/ui/Stepper';
import TextField from '@/components/ui/TextField';
import Chip from '@/components/ui/Chip';
import ButtonGroup from '@/components/ui/ButtonGroup';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/constants';

// ── 타입 ──────────────────────────────────────────────────────────

/**
 * 업종 선택 값 타입
 * Figma 기준 8개 항목 (types/index.ts IndustryType 확장 예정)
 */
type IndustryValue =
  | 'IT'
  | 'MANUFACTURING'
  | 'FINANCE'
  | 'PUBLIC'
  | 'EDUCATION'
  | 'LAW'
  | 'MEDIA'
  | 'OTHER';

/**
 * 경력 선택 값 타입
 * Figma 기준 4단계 (types/index.ts CareerYearType 확장 예정)
 */
type CareerValue = 'NEW' | 'JUNIOR' | 'MIDDLE' | 'SENIOR';

// ── 상수 ──────────────────────────────────────────────────────────

/** 이메일 도메인 선택지 */
const EMAIL_DOMAINS = [
  'naver.com',
  'gmail.com',
  'daum.net',
  'kakao.com',
  'hanmail.net',
];

/** 업종 선택 항목 목록 (Figma 기준) */
const INDUSTRY_OPTIONS: { value: IndustryValue; label: string }[] = [
  { value: 'IT', label: 'IT&스타트업' },
  { value: 'MANUFACTURING', label: '제조' },
  { value: 'FINANCE', label: '금융&보험' },
  { value: 'PUBLIC', label: '공공기관' },
  { value: 'EDUCATION', label: '교육' },
  { value: 'LAW', label: '법률&컨설팅' },
  { value: 'MEDIA', label: '미디어&광고' },
  { value: 'OTHER', label: '기타' },
];

/** 경력 선택 항목 목록 (Figma 기준) */
const CAREER_OPTIONS: { value: CareerValue; label: string }[] = [
  { value: 'NEW', label: '신입(1년 미만)' },
  { value: 'JUNIOR', label: '주니어(1~3년차)' },
  { value: 'MIDDLE', label: '미들(4~6년차)' },
  { value: 'SENIOR', label: '시니어(7년차 이상)' },
];

// ── 내부 서브 컴포넌트 ────────────────────────────────────────────

/**
 * FieldLabel
 *
 * 필드 상단 레이블 행 (라벨 텍스트 + 필수 * 마크)
 * TextField의 label prop과 동일한 시각 스펙.
 * Chip 섹션처럼 TextField를 쓰지 않는 필드에 사용합니다.
 */
const FieldLabel = ({ label }: { label: string }) => (
  <div className="flex gap-2.5 items-center px-2.5 pb-2.5">
    <span className="text-base leading-6 tracking-tight font-normal text-text-tertiary">
      {label}
    </span>
    <span
      aria-hidden="true"
      className="text-base leading-6 tracking-tight text-text-danger font-normal"
    >
      *
    </span>
  </div>
);

/**
 * PasswordRule
 *
 * 비밀번호 규칙 안내 아이템 하나.
 * - satisfied=false → info 아이콘 + text-text-disabled (회색)
 * - satisfied=true  → check-circle 아이콘 + text-text-success (초록)
 */
const PasswordRule = ({
  satisfied,
  label,
}: {
  satisfied: boolean;
  label: string;
}) => (
  <div className="flex items-center gap-1 py-1">
    <Icon
      name={satisfied ? 'check-circle' : 'info'}
      size={14}
      color={
        satisfied ? 'var(--color-icon-success)' : 'var(--color-icon-disabled)'
      }
    />
    <span
      className={`
        text-xs leading-4.5 tracking-tight whitespace-nowrap
        ${satisfied ? 'text-text-success' : 'text-text-disabled'}
      `}
    >
      {label}
    </span>
  </div>
);

/**
 * ChevronDownIcon
 *
 * 이메일 도메인 드롭다운 내 화살표 아이콘.
 */
const ChevronDownIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 9l6 6 6-6"
      stroke="var(--color-icon-tertiary)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── 메인 컴포넌트 ─────────────────────────────────────────────────

/**
 * JoinInfoPage
 *
 * 회원가입 - 회원 정보 입력 페이지입니다.
 * 경로: /join/info
 * 디자인 기준: Figma node 654-8788
 *
 * 라우팅 흐름:
 *   이전 → ROUTES.JOIN_ACCEPT (약관 동의 페이지)
 *   다음 → ROUTES.JOIN_COMPLETE (모든 필수 항목 입력 완료 시)
 *
 * 화면 구성 (위→아래):
 *   1. Stepper      — step=2 (회원가입 진행 중)
 *   2. TitleText    — heading="회원 정보"
 *   3. 입력 필드 섹션
 *      a. 이메일 입력  — username + @ + 도메인 select + 중복확인 버튼
 *      b. 비밀번호 입력 — hide/show 토글 + 3개 규칙 안내
 *      c. 닉네임 입력  — 유효 시 check-circle 아이콘
 *      d. 업종 선택    — 4열 Chip 그리드 (8개)
 *      e. 경력 선택    — 4열 Chip 그리드 (4개)
 *   4. ButtonGroup  — 이전 / 다음
 *
 * 상태 구조:
 *   emailId        — @ 앞 사용자명
 *   emailDomain    — @ 뒤 도메인 (select)
 *   emailChecked   — 중복 확인 완료 여부
 *   password       — 비밀번호 (규칙 실시간 검증)
 *   showPassword   — 비밀번호 표시 여부
 *   nickname       — 닉네임 (2자 이상 시 유효)
 *   industry       — 선택된 업종 (null = 미선택)
 *   career         — 선택된 경력 (null = 미선택)
 *
 * canProceed 조건 (다음 버튼 활성):
 *   emailChecked && 비밀번호 규칙 3개 모두 통과
 *   && nicknameIsValid && industry !== null && career !== null
 */
const JoinInfoPage = () => {
  const navigate = useNavigate();

  // ── 이메일 ──────────────────────────────────────────────────────

  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('naver.com');

  /**
   * 중복 확인 완료 여부
   * emailId 또는 도메인이 변경되면 false로 초기화합니다.
   */
  const [emailChecked, setEmailChecked] = useState(false);

  const handleEmailIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmailId(e.target.value);
    setEmailChecked(false);
  };

  const handleDomainChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setEmailDomain(e.target.value);
    setEmailChecked(false);
  };

  // ── 비밀번호 ────────────────────────────────────────────────────

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /*
   * 비밀번호 규칙 실시간 검증
   * password가 비어 있으면 세 규칙 모두 false (회색 상태)
   */
  const pwHasUpperAndLower =
    password.length > 0 && /(?=.*[A-Z])(?=.*[a-z])/.test(password);
  const pwHasDigit = password.length > 0 && /\d/.test(password);
  const pwNoConsecutive =
    password.length > 0 &&
    !/012|123|234|345|456|567|678|789|890|111|222|333|444|555|666|777|888|999/.test(
      password
    );
  const pwIsValid = pwHasUpperAndLower && pwHasDigit && pwNoConsecutive;

  // ── 닉네임 ──────────────────────────────────────────────────────

  const [nickname, setNickname] = useState('');
  /*
   * TODO: API 연동 후 서버 닉네임 중복 확인으로 교체
   *       현재는 2자 이상이면 클라이언트에서 유효 처리
   */
  const nicknameIsValid = nickname.length >= 2;

  // ── 업종 / 경력 ─────────────────────────────────────────────────

  const [industry, setIndustry] = useState<IndustryValue | null>(null);
  const [career, setCareer] = useState<CareerValue | null>(null);

  // ── 다음 버튼 활성 조건 ─────────────────────────────────────────

  const canProceed =
    emailChecked &&
    pwIsValid &&
    nicknameIsValid &&
    industry !== null &&
    career !== null;

  // ── 이전/다음 핸들러 ────────────────────────────────────────────

  /**
   * @param val - ButtonGroup이 반환한 option.value ('prev' | 'next')
   */
  const handleNavigation = (val: string) => {
    if (val === 'prev') {
      navigate(ROUTES.JOIN_ACCEPT);
    }
    if (val === 'next' && canProceed) {
      // TODO: useSignupMutation으로 교체
      //       - onSuccess에서 navigate(ROUTES.JOIN_COMPLETE)
      //       - onError에서 API 에러 메시지 표시
      navigate(ROUTES.JOIN_COMPLETE);
    }
  };

  return (
    <div className="join-info max-w-180 w-full flex flex-col gap-16 items-center mb-7.5">
      {/* ── 진행 단계 표시 ─────────────────────────────────────── */}
      {/*
       * step=2: 회원가입 진행 중
       * 1(약관 동의 ✓) → 2(회원가입 현재) → 3(가입 완료)
       */}
      <Stepper step={2} />

      {/* ── 페이지 제목 ──────────────────────────────────────────── */}
      <TitleText heading="회원 정보" />

      {/* ── 입력 필드 섹션 ─────────────────────────────────────── */}
      {/*
       * 상단: 로그인 정보(이메일 + 비밀번호)
       * 하단: 프로필 설정(닉네임 + 업종 + 경력)
       * 두 그룹 사이 gap-10
       */}
      <div className="w-full flex flex-col gap-10">
        {/* ── 로그인 정보 ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-10">
          {/* ── 이메일 입력 ───────────────────────────────────────── */}
          {/*
           * 레이아웃: [username input + @] flex-1 | [domain select] | [중복확인]
           * emailId 또는 domain 변경 시 emailChecked 초기화
           */}
          <div className="flex flex-col">
            <FieldLabel label="이메일 입력" />
            <div className="flex items-center gap-2.5">
              {/* username input + @ 기호 */}
              <div
                className="
                  flex flex-1 min-w-0 items-center gap-2.5
                  h-16.5 rounded-lg px-6
                  bg-background-subtle border border-border-default
                  focus-within:border-border-focus transition-colors
                "
              >
                <input
                  type="text"
                  value={emailId}
                  onChange={handleEmailIdChange}
                  placeholder="이메일 주소 입력"
                  autoComplete="username"
                  className="
                    flex-1 min-w-0 bg-transparent outline-none
                    text-lg leading-6.5 font-semibold tracking-tight
                    text-text-secondary
                    placeholder:text-text-placeholder placeholder:font-normal
                  "
                />
                <span className="text-lg leading-6.5 font-semibold tracking-tight text-text-placeholder shrink-0">
                  @
                </span>
              </div>

              {/* 도메인 드롭다운 */}
              {/*
               * native <select> + 절대 위치 화살표 아이콘
               * appearance-none으로 기본 화살표 제거
               */}
              <div className="relative shrink-0">
                <select
                  value={emailDomain}
                  onChange={handleDomainChange}
                  className="
                    appearance-none
                    bg-background-surface border border-border-default
                    h-16.5 rounded-lg pl-6 pr-10
                    text-lg leading-6.5 font-semibold tracking-tight text-text-placeholder
                    w-[168px] cursor-pointer outline-none
                    focus:border-border-focus transition-colors
                  "
                >
                  {EMAIL_DOMAINS.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
                {/* 드롭다운 화살표 아이콘 (클릭 통과) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDownIcon />
                </div>
              </div>

              {/* 중복확인 버튼 */}
              {/*
               * emailId가 비어 있으면 비활성화
               * TODO: API 연동 후 실제 중복 확인 요청으로 교체
               *       - 성공 시 setEmailChecked(true)
               *       - 실패(중복) 시 에러 메시지 표시
               */}
              <button
                type="button"
                onClick={() => {
                  if (emailId.trim()) setEmailChecked(true);
                }}
                disabled={!emailId.trim()}
                className="
                  shrink-0
                  bg-background-inverse text-text-inverse
                  h-16.5 rounded-2xl px-6
                  text-lg leading-6.5 font-semibold tracking-tight whitespace-nowrap
                  hover:bg-background-hover-2 active:bg-background-pressed-2
                  transition-colors
                  disabled:bg-background-disabled disabled:text-text-disabled
                  disabled:cursor-not-allowed
                "
              >
                중복확인
              </button>
            </div>
          </div>

          {/* ── 비밀번호 입력 ──────────────────────────────────────── */}
          {/*
           * TextField + 규칙 3개 안내 (실시간 검증)
           * 각 규칙: info 아이콘(미충족) / check-circle 아이콘(충족)
           */}
          <div className="flex flex-col gap-2.5">
            <TextField
              label="비밀번호 입력"
              required
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              autoComplete="new-password"
              rightIcon={showPassword ? 'show' : 'hide'}
              onRightIconClick={() => setShowPassword((p) => !p)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* 비밀번호 규칙 안내 */}
            <div className="flex items-center gap-5 px-2.5">
              <PasswordRule
                satisfied={pwHasUpperAndLower}
                label="영문 대문자 1자 이상 소문자 혼합"
              />
              <PasswordRule satisfied={pwHasDigit} label="숫자 포함" />
              <PasswordRule
                satisfied={pwNoConsecutive}
                label="연속숫자 3개 이상 불가 (ex: 123..)"
              />
            </div>
          </div>
        </div>

        {/* ── 프로필 설정 ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-10">
          {/* ── 닉네임 입력 ───────────────────────────────────────── */}
          {/*
           * 2자 이상 입력 시 check-circle 아이콘 표시
           * TODO: API 닉네임 중복 확인 연동 후 nicknameIsValid 로직 교체
           */}
          <TextField
            label="닉네임 입력"
            required
            type="text"
            placeholder="닉네임 입력"
            autoComplete="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            rightSlot={
              nicknameIsValid ? (
                <Icon
                  name="check-circle"
                  size={24}
                  color="var(--color-icon-success)"
                  className="shrink-0"
                />
              ) : null
            }
          />

          {/* ── 업종 선택 ─────────────────────────────────────────── */}
          {/*
           * 4열 그리드 / 2행 (총 8개)
           * 단일 선택 — 선택 시 해당 항목 Chip active 상태
           * min-w-0 w-full로 Chip 기본 min-width 오버라이드 (그리드 셀 채움)
           */}
          <div className="flex flex-col">
            <FieldLabel label="업종" />
            <div className="grid grid-cols-4 gap-4 w-full">
              {INDUSTRY_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  selected={industry === opt.value}
                  onClick={() => setIndustry(opt.value)}
                  className="min-w-0 w-full"
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* ── 경력 선택 ─────────────────────────────────────────── */}
          {/*
           * 4열 그리드 / 1행 (총 4개)
           * 단일 선택
           */}
          <div className="flex flex-col">
            <FieldLabel label="경력" />
            <div className="grid grid-cols-4 gap-4 w-full">
              {CAREER_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  selected={career === opt.value}
                  onClick={() => setCareer(opt.value)}
                  className="min-w-0 w-full"
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 이전 / 다음 내비게이션 버튼 ────────────────────────── */}
      {/*
       * canProceed=false → value='' → 이전·다음 모두 mute
       * canProceed=true  → value='next' → 다음 primary
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

export default JoinInfoPage;
