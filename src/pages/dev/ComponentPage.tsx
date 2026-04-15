/**
 * ComponentPage
 *
 * 공통 UI 컴포넌트 확인용 개발 전용 페이지입니다.
 * 라우트: /dev/components
 *
 * ⚠️ 프로덕션 배포 전 반드시 App.tsx에서 해당 라우트를 주석 처리하세요.
 *    → App.tsx 하단 "[DEV ONLY]" 블록 참고
 */

import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  TitleText,
  Icon,
  Chip,
  TextField,
  Button,
  ButtonGroup,
  Stepper,
} from '@/components/ui';
import type { IconName, StepNumber } from '@/components/ui';

// ─────────────────────────────────────────────────────────────────
// 내부 레이아웃 헬퍼 컴포넌트 (이 파일에서만 사용)
// ─────────────────────────────────────────────────────────────────

/**
 * Section
 * 각 컴포넌트 그룹을 구분하는 섹션 래퍼입니다.
 * - 제목 + 구분선 조합으로 섹션을 시각적으로 분리합니다.
 * - 내용은 흰색 카드(bg-background-surface) 위에 표시됩니다.
 */
const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-3">
    {/* 섹션 헤더 (제목 + 구분선) */}
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        <h2 className="text-xl leading-5.5 font-bold text-text-primary tracking-tight shrink-0">
          {title}
        </h2>
        {/* 우측 구분선 */}
        <div className="flex-1 h-[1px] bg-border-default" />
      </div>
      {description && (
        <p className="text-sm leading-5 text-text-tertiary tracking-tight">
          {description}
        </p>
      )}
    </div>

    {/* 컴포넌트 카드 */}
    <div className="bg-background-surface rounded-2xl p-10 flex flex-col gap-8">
      {children}
    </div>
  </section>
);

/**
 * Case
 * 섹션 내 개별 케이스 (상태·변형) 표시 단위입니다.
 * - 상단에 케이스 라벨, 하단에 실제 컴포넌트를 표시합니다.
 */
const Case = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    {/* 케이스 라벨 */}
    <p className="text-xs leading-4 tracking-tight text-text-tertiary font-medium">
      {label}
    </p>
    <div>{children}</div>
  </div>
);

/**
 * CaseRow
 * 여러 케이스를 가로로 나열하는 컨테이너입니다.
 */
const CaseRow = ({
  children,
  align = 'start',
}: {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
}) => <div className={`flex flex-wrap gap-10 items-${align}`}>{children}</div>;

/**
 * SectionDivider
 * 섹션 내 케이스들 사이의 얇은 구분선입니다.
 */
const SectionDivider = () => <div className="h-[1px] bg-border-subtle" />;

// ─────────────────────────────────────────────────────────────────
// 데이터 상수
// ─────────────────────────────────────────────────────────────────

/** 모든 아이콘 이름 목록 (Icon.tsx IconName 타입 기준, 18개) */
const ALL_ICON_NAMES: IconName[] = [
  'mail',
  'hide',
  'lock',
  'check',
  'question',
  'setting',
  'search',
  'filter',
  'loading',
  'no-symbol',
  'home',
  'profile',
  'alert',
  'pencil-ai',
  'library',
  'info',
  'close-circle',
  'check-circle',
];

/** Button 상태 케이스 목록 */
const BTN_CASES: {
  label: string;
  variant?: 'default' | 'primary' | 'mute' | 'loading' | 'success' | 'danger';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  text: string;
}[] = [
  { label: 'Default', text: 'Default' },
  {
    label: 'Default + Icon (left)',
    icon: 'pencil-ai',
    iconPosition: 'left',
    text: 'Default',
  },
  {
    label: 'Default + Icon (right)',
    icon: 'pencil-ai',
    iconPosition: 'right',
    text: 'Default',
  },
  { label: 'Mute', variant: 'mute', text: 'Mute' },
  { label: 'Disabled', disabled: true, text: 'Disabled' },
  { label: 'Loading', variant: 'loading', text: 'Loading' },
  { label: 'Success', variant: 'success', text: 'Success' },
  { label: 'Danger', variant: 'danger', text: 'Danger' },
];

// ─────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────

const ComponentPage = () => {
  // ── 상태 (인터랙티브 컴포넌트용) ─────────────────────────────

  /** Chip 선택 상태 (수신자 유형 선택 예시) */
  const [selectedChip, setSelectedChip] = useState<string | null>('boss');

  /** ButtonGroup 선택 상태 */
  const [groupValue, setGroupValue] = useState('accept');

  /** Stepper 현재 단계 */
  const [stepperStep, setStepperStep] = useState<StepNumber>(1);

  return (
    /*
     * 페이지 전체 컨테이너
     * bg-background-subtle: 연한 회색 배경 (섹션 카드가 돋보이게)
     * 충분한 패딩으로 가독성 확보
     */
    <div className="min-h-screen bg-background-subtle px-16 py-14">
      {/* ── 페이지 헤더 ──────────────────────────────────────── */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-1 bg-background-brand-subtle px-2 py-0.5 rounded-full mb-2">
          <span className="text-xs text-text-brand font-medium tracking-tight">
            DEV ONLY
          </span>
        </div>
        <h1 className="text-3xl-plus leading-10 font-bold text-text-primary tracking-tight mb-1">
          Component Library
        </h1>
        <p className="text-base leading-6 text-text-secondary tracking-tight">
          ToneFit 공통 UI 컴포넌트 목록입니다. 프로덕션 배포 전 라우트를
          비활성화하세요.
        </p>
      </div>

      {/* 섹션 목록 */}
      <div className="flex flex-col gap-14">
        {/* ── Icon ──────────────────────────────────────── */}
        <Section
          title="Icon"
          description={`SVG 아이콘 컴포넌트. 총 ${ALL_ICON_NAMES.length}개. size / color prop으로 제어합니다.`}
        >
          <div className="grid grid-cols-6 gap-4">
            {ALL_ICON_NAMES.map((name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-1 p-3 bg-background-subtle rounded-xl"
              >
                <Icon name={name} size={24} color="var(--color-icon-primary)" />
                <span className="text-2xs leading-3.5 text-text-tertiary tracking-tight text-center">
                  {name}
                </span>
              </div>
            ))}
          </div>

          <SectionDivider />

          {/* 사이즈 변형 */}
          <Case label="size 변형 (name='pencil-ai')">
            <div className="flex items-end gap-4">
              {[16, 20, 24, 32, 40].map((size) => (
                <div key={size} className="flex flex-col items-center gap-0.5">
                  <Icon
                    name="pencil-ai"
                    size={size}
                    color="var(--color-icon-primary)"
                  />
                  <span className="text-2xs text-text-tertiary">{size}px</span>
                </div>
              ))}
            </div>
          </Case>
        </Section>

        {/* ── Stepper ───────────────────────────────────── */}
        <Section
          title="Stepper"
          description="회원가입 진행 단계 표시. step prop(1~4)으로 현재 단계를 설정합니다."
        >
          {/* 인터랙티브 컨트롤 */}
          <Case label="인터랙티브 (버튼으로 단계 전환)">
            <div className="flex flex-col gap-4">
              <div className="max-w-[360px]">
                <Stepper step={stepperStep} />
              </div>
              {/* 단계 이동 버튼 */}
              <div className="flex gap-2">
                {([1, 2, 3, 4] as StepNumber[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStepperStep(s)}
                    className={`
                      px-3 py-1 rounded-lg
                      text-sm font-medium tracking-tight
                      transition-colors cursor-pointer border
                      ${
                        stepperStep === s
                          ? 'bg-background-inverse text-text-inverse border-background-inverse'
                          : 'bg-background-subtle text-text-secondary border-border-default hover:bg-background-muted'
                      }
                    `}
                  >
                    Step {s}
                  </button>
                ))}
              </div>
            </div>
          </Case>

          <SectionDivider />

          {/* 전체 상태 정적 표시 */}
          <div className="flex flex-col gap-8">
            {([1, 2, 3, 4] as StepNumber[]).map((s) => (
              <Case
                key={s}
                label={
                  s === 1
                    ? 'step=1 (약관 동의 진행 중)'
                    : s === 2
                      ? 'step=2 (회원가입 진행 중)'
                      : s === 3
                        ? 'step=3 (가입 완료 진행 중)'
                        : 'step=4 (모든 단계 완료)'
                }
              >
                <div className="max-w-[360px]">
                  <Stepper step={s} />
                </div>
              </Case>
            ))}
          </div>
        </Section>

        {/* ── TitleText ─────────────────────────────────── */}
        <Section
          title="TitleText"
          description="페이지 상단 타이틀 + 서브타이틀 조합. variant='lg'는 PC용(36px), variant='md'는 모바일용(28px)."
        >
          <CaseRow>
            <Case label="variant='lg' (기본값)">
              <TitleText
                variant="lg"
                heading="ToneFit에 오신 것을 환영합니다"
                subtitle="비즈니스 이메일 교정 서비스, 더 나은 업무 소통을 시작해보세요."
              />
            </Case>
          </CaseRow>

          <SectionDivider />

          <CaseRow>
            <Case label="variant='md'">
              <TitleText
                variant="md"
                heading="로그인"
                subtitle={
                  '비즈니스 이메일 교정 서비스,\n더 나은 업무 소통을 시작해보세요.'
                }
              />
            </Case>
          </CaseRow>
        </Section>

        {/* ── TextField ─────────────────────────────────── */}
        <Section
          title="TextField"
          description="기본 입력 필드. rightIcon / rightSlot prop으로 우측 영역을 제어합니다. label prop이 있으면 라벨 행(+ 선택적 필수 마크)을 입력 필드 위에 표시합니다. "
        >
          <CaseRow align="start">
            <Case label="기본 (label + rightIcon)">
              <div className="w-[400px]">
                <TextField
                  label="이메일"
                  placeholder="이메일을 입력해 주세요"
                  rightIcon="mail"
                />
              </div>
            </Case>
            <Case label="필수 입력 (required)">
              <div className="w-[400px]">
                <TextField
                  label="비밀번호"
                  required
                  type="password"
                  placeholder="비밀번호를 입력해 주세요"
                  rightIcon="lock"
                />
              </div>
            </Case>
          </CaseRow>

          <SectionDivider />

          <CaseRow align="start">
            <Case label="기본 (Default)">
              <div className="w-[400px]">
                <TextField
                  placeholder="이메일을 입력해 주세요"
                  rightIcon="mail"
                />
              </div>
            </Case>
            <Case label="입력됨 (Filled)">
              <div className="w-[400px]">
                <TextField defaultValue="example@tonefit.kr" rightIcon="mail" />
              </div>
            </Case>
          </CaseRow>

          <SectionDivider />

          <CaseRow align="start">
            <Case label="에러 (Error)">
              <div className="w-[400px]">
                <TextField
                  label="이메일"
                  defaultValue="invalid-email"
                  rightIcon="mail"
                  error
                />
              </div>
            </Case>
            <Case label="비활성화 (Disabled)">
              <div className="w-[400px]">
                <TextField
                  placeholder="입력 불가"
                  label="비밀번호"
                  rightIcon="lock"
                  disabled
                />
              </div>
            </Case>
          </CaseRow>

          <SectionDivider />
          <Case label="우측 커스텀 슬롯 (rightSlot — 비밀번호 토글 예시)">
            <div className="w-[400px]">
              <TextField
                type="password"
                placeholder="비밀번호를 입력해 주세요"
                rightSlot={
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer"
                    aria-label="비밀번호 표시"
                  >
                    <Icon
                      name="lock"
                      size={20}
                      color="var(--color-icon-secondary)"
                    />
                  </button>
                }
              />
            </div>
          </Case>
        </Section>

        {/* ── Button ───────────────────────────────────── */}
        <Section
          title="Button"
          description="전체 너비 CTA 버튼. variant prop으로 loading / success / danger 상태를 제어합니다. hover / pressed는 CSS로 자동 처리됩니다."
        >
          {/*
           * 인터랙션 확인 포인트 (hover / pressed)
           * - Default 버튼 Hover   → bg-background-hover (배경 색상 변경)
           * - Default 버튼 Pressed → bg-background-pressed
           * - 아이콘 있는 버튼 Hover   → 아이콘 색상 text-icon-hover로 변경 (group 패턴)
           * - 아이콘 있는 버튼 Pressed → 아이콘 색상 text-icon-pressed로 변경
           * - Loading / Success / Danger → hover 없음 (인터랙션 미적용)
           * ⬆ 'Default', 'Default + Icon (left/right)' 케이스에서 마우스 올리기/클릭으로 확인하세요.
           */}
          {/*
           * 각 상태를 독립된 케이스로 표시
           * 너비를 max-w-[480px]로 제한하여 컴포넌트 형태 확인
           */}
          <div className="grid grid-cols-3 gap-8">
            {BTN_CASES.map((c) => (
              <Case key={c.label} label={c.label}>
                <div className="max-w-[524px]">
                  <Button
                    variant={c.variant}
                    icon={c.icon}
                    iconPosition={c.iconPosition}
                    disabled={c.disabled}
                  >
                    {c.text}
                  </Button>
                </div>
              </Case>
            ))}
          </div>
        </Section>

        {/* ── ButtonGroup ───────────────────────────────── */}
        <Section
          title="ButtonGroup"
          description="2개의 옵션 중 하나를 선택하는 토글 버튼 그룹. options / value / onChange prop으로 제어합니다."
        >
          {/*
           * 인터랙션 확인 포인트 (hover / pressed)
           * - 선택됨 버튼 Hover   → bg-background-hover  (진한 배경 위에서 hover 색)
           * - 선택됨 버튼 Pressed → bg-background-pressed
           * - 미선택 버튼 Hover   → bg-background-hover  (muted 위에서 hover 색)
           * - 미선택 버튼 Pressed → bg-background-pressed
           * ⬆ '기본 (인터랙티브)' 케이스에서 선택됨/미선택 버튼에 마우스 올리기/클릭으로 확인하세요.
           */}
          <CaseRow>
            <Case label="기본 (인터랙티브 — 클릭하여 전환)">
              <div className="w-[520px]">
                <ButtonGroup
                  options={[
                    { value: 'accept', label: '수락' },
                    { value: 'recorrect', label: '재교정' },
                  ]}
                  value={groupValue}
                  onChange={setGroupValue}
                />
              </div>
            </Case>
          </CaseRow>
        </Section>

        {/* ── Chip ──────────────────────────────────────── */}
        <Section
          title="Chip"
          description="선택 가능한 칩 버튼. selected prop으로 선택 상태를 제어합니다."
        >
          {/*
           * 인터랙션 확인 포인트 (hover / pressed)
           * - 미선택 Hover  → bg-background-muted  (subtle → muted, 미세하게 어두워짐)
           * - 선택됨 Hover  → bg-background-hover  (inverse 위에서 hover 색으로 전환)
           * - 모든 상태 Pressed(:active) → bg-background-pressed
           * ⬆ 위 케이스들은 마우스 올리기/클릭으로 직접 확인하세요.
           */}
          <Case label="선택/미선택 (클릭하여 토글)">
            <div className="flex flex-wrap gap-4">
              {[
                { value: 'boss', label: '상사' },
                { value: 'colleague', label: '동료' },
                { value: 'partner', label: '협력사' },
                { value: 'client', label: '고객 & 거래처' },
              ].map((opt) => (
                <Chip
                  key={opt.value}
                  selected={selectedChip === opt.value}
                  onClick={() =>
                    setSelectedChip(
                      selectedChip === opt.value ? null : opt.value
                    )
                  }
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </Case>

          <SectionDivider />

          <CaseRow>
            <Case label="미선택 (Default)">
              <Chip selected={false}>버튼</Chip>
            </Case>
            <Case label="선택됨 (Active)">
              <Chip selected>버튼</Chip>
            </Case>
            <Case label="비활성화 (Disabled)">
              <Chip disabled>버튼</Chip>
            </Case>
          </CaseRow>
        </Section>
      </div>
      {/* end 섹션 목록 */}

      {/* ── 페이지 푸터 ──────────────────────────────────────── */}
      <div className="mt-14 pt-4 border-t border-border-subtle text-center">
        <p className="text-xs text-text-disabled tracking-tight">
          ToneFit Component Library — Dev Only Page (/dev/components)
        </p>
      </div>
    </div>
  );
};

export default ComponentPage;
