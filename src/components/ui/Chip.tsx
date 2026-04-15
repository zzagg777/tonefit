import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 선택 여부
   * - true  : bg-background-inverse + text-text-inverse (진한 배경)
   * - false : bg-background-subtle + text-text-placeholder (연한 배경)
   * @default false
   */
  selected?: boolean;
  /** 칩 레이블 텍스트 */
  children: ReactNode;
}

/**
 * Chip
 *
 * 선택 가능한 칩 버튼 컴포넌트입니다. (Figma node 298:2065)
 * 수신자 유형·이메일 목적 선택 등 단일/다중 선택 UI에 사용합니다.
 *
 * 시각 스펙 (Figma 기준):
 * - 높이: 66px
 * - 최소 너비: 140px (텍스트에 따라 자동 확장)
 * - 수평 패딩: 26px
 * - 모서리: rounded-2xl (20px)
 * - 타이포그래피: Title/M (18px / SemiBold / 26px line-height / -0.02em tracking)
 *
 * 상태별 스타일 (CLAUDE.md 4.4 기준):
 * ┌───────────────────┬──────────────────────────────────────────────────────────────┐
 * │ Default (미선택)  │ bg-background-subtle / text-text-placeholder                 │
 * │ Active  (선택됨)  │ bg-background-inverse / text-text-inverse                    │
 * │ Hover   (공통)    │ bg-background-hover-2 / text-text-inverse                │
 * │ Pressed (공통)    │ bg-background-pressed-2 / text-text-inverse            │
 * │ Disabled          │ bg-background-disabled / text-text-disabled                  │
 * └───────────────────┴──────────────────────────────────────────────────────────────┘
 *
 * 접근성:
 * - aria-pressed로 선택 상태를 스크린 리더에 전달합니다.
 * - disabled 상태에서는 pointer-events-none으로 이벤트를 차단합니다.
 *
 * @example
 * // 단일 선택 그룹
 * const [selected, setSelected] = useState<ReceiverType | null>(null);
 * {RECEIVER_TYPE_OPTIONS.map(opt => (
 *   <Chip
 *     key={opt.value}
 *     selected={selected === opt.value}
 *     onClick={() => setSelected(opt.value)}
 *   >
 *     {RECEIVER_TYPE_LABELS[opt.value]}
 *   </Chip>
 * ))}
 *
 * @example
 * // 다중 선택 그룹
 * const [selectedPurposes, setSelected] = useState<Set<PurposeType>>(new Set());
 * {PURPOSE_OPTIONS.map(opt => (
 *   <Chip
 *     key={opt.value}
 *     selected={selectedPurposes.has(opt.value)}
 *     onClick={() => togglePurpose(opt.value)}
 *   >
 *     {PURPOSE_LABELS[opt.value]}
 *   </Chip>
 * ))}
 */
const Chip = ({
  selected = false,
  disabled,
  children,
  className = '',
  ...props
}: ChipProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      className={`
        inline-flex items-center justify-center
        h-16.5 min-w-35 px-4
        rounded-2xl
        text-lg leading-6.5 font-semibold tracking-tight
        transition-colors
        ${
          disabled
            ? /* Disabled: 회색 처리 + 클릭 차단 (CLAUDE.md 4.4) */
              'bg-background-disabled text-text-disabled cursor-not-allowed pointer-events-none'
            : selected
              ? /* Active(선택됨): 진한 배경 + 흰 텍스트 */
                'bg-background-inverse text-text-inverse cursor-pointer ' +
                'hover:bg-background-hover-2 hover:text-text-inverse ' +
                'active:bg-background-pressed-2 active:text-text-inverse'
              : /* Default(미선택): 연한 배경 + 흐린 텍스트 */
                'bg-background-subtle text-text-placeholder cursor-pointer ' +
                'hover:bg-background-hover-2 hover:text-text-inverse ' +
                'active:bg-background-pressed-2 active:text-text-inverse'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Chip;
export type { ChipProps };
