import {
  useState,
  useCallback,
  useEffect,
  useRef,
  Fragment,
  type ReactElement,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@/components/ui';
import {
  ROUTES,
  CORRECTION_LABEL_INFO,
  RECEIVER_TYPE_LABELS,
  PURPOSE_LABELS,
} from '@/constants';
import { useRecorrect, useConfirmCorrection } from '@/queries';
import { MOCK_ORIGINAL, MOCK_CORRECTION_RESPONSE } from '@/mocks/handlers';
import type {
  CorrectionResponse,
  CorrectionChange,
  FeedbackActionType,
  ReceiverType,
  PurposeType,
  CorrectionLabelType,
} from '@/types';

interface LocationState {
  correctionData: CorrectionResponse;
  originalEmail: string;
  receiverType: ReceiverType;
  purposeType: PurposeType;
}

const MOCK_STATE: LocationState = {
  originalEmail: MOCK_ORIGINAL,
  receiverType: 'DIRECT_SUPERVISOR',
  purposeType: 'REPORT',
  correctionData: MOCK_CORRECTION_RESPONSE,
};

// true: 피그마 디자인 기준 고정값(plain text), false: 실제 원문 + 하이라이트
const USE_FIXED_ORIGINAL = true;

const labelCls =
  'word-label rounded-full px-1 py-0.5 border !text-text-secondary';
const LABEL_CLASS: Record<CorrectionLabelType, string> = {
  AUTO: 'required',
  SUGGEST: 'recommend',
  STYLE: 'reference',
};

// 텍스트에서 변경 항목을 하이라이트 렌더링
const renderWithHighlights = (
  text: string,
  changes: (CorrectionChange & {
    action: FeedbackActionType | null;
    rejectReason?: string;
  })[],
  activeIndex: number,
  mode: 'original' | 'corrected',
  onSelect: (changeIndex: number) => void
) => {
  if (mode === 'original') {
    // 원문: start/end offset 기반 하이라이트
    const sorted = [...changes].sort((a, b) => a.start - b.start);
    const parts: {
      text: string;
      change?: CorrectionChange;
      isActive: boolean;
    }[] = [];
    let pos = 0;

    for (const change of sorted) {
      if (change.start > pos) {
        parts.push({ text: text.slice(pos, change.start), isActive: false });
      }
      parts.push({
        text: text.slice(change.start, change.end),
        change,
        isActive: change.index === activeIndex,
      });
      pos = change.end;
    }
    if (pos < text.length) {
      parts.push({ text: text.slice(pos), isActive: false });
    }

    return parts.map((part, i) => {
      if (!part.change) return <span key={i}>{part.text}</span>;
      return (
        <mark
          key={i}
          onClick={() => onSelect(part.change!.index)}
          className={`${labelCls} ${LABEL_CLASS[part.change.label]} cursor-pointer ${part.isActive ? 'mark-focus' : ''}`}
        >
          {part.text}
        </mark>
      );
    });
  }

  // 교정본: corrected 문자열 검색 후 하이라이트 (텍스트 등장 순서로 정렬)
  let remaining = text;
  const parts: ReactElement[] = [];
  let keyIdx = 0;

  const sortedByPos = [...changes]
    .map((c) => ({ ...c, pos: text.indexOf(c.corrected) }))
    .filter((c) => c.pos !== -1)
    .sort((a, b) => a.pos - b.pos);

  for (const change of sortedByPos) {
    const target = change.corrected;
    const idx = remaining.indexOf(target);
    if (idx === -1) continue;
    if (idx > 0) {
      parts.push(<span key={keyIdx++}>{remaining.slice(0, idx)}</span>);
    }
    const isActive = change.index === activeIndex;
    parts.push(
      <mark
        key={keyIdx++}
        onClick={() => onSelect(change.index)}
        className={`${labelCls} ${LABEL_CLASS[change.label]} cursor-pointer ${isActive ? 'mark-focus' : ''}`}
      >
        {target}
      </mark>
    );
    remaining = remaining.slice(idx + target.length);
  }
  if (remaining) parts.push(<span key={keyIdx++}>{remaining}</span>);

  return parts;
};

// ── CorrectionCard 타입 및 상수 ────────────────────────────────────────

type CardStep = 'pending' | 'accepted' | 'rejecting' | 'rejected';

const REJECT_REASONS_1 = [
  '의미가 달라졌어요',
  '내 스타일&상황과 안 맞아요',
  '다른 이유가 있어요',
] as const;
type RejectReason1 = (typeof REJECT_REASONS_1)[number];

const REJECT_REASONS_2: Record<RejectReason1, readonly string[] | null> = {
  '의미가 달라졌어요': [
    '내 평소 표현을 유지하고 싶어요',
    '이 상황에 어조가 안맞아요',
    '그냥 어색해요',
  ],
  '내 스타일&상황과 안 맞아요': [
    '내 평소 표현을 유지하고 싶어요',
    '이 상황에 어조가 안맞아요',
    '그냥 어색해요',
  ],
  '다른 이유가 있어요': null,
};

// ── 소형 공용 컴포넌트 ──────────────────────────────────────────────────

const PlayArrow = ({ color = '#374151' }: { color?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="9"
    height="11"
    viewBox="0 0 9 11"
    fill="none"
    className="shrink-0"
  >
    <path
      d="M0 1.00354C0 0.212376 0.875246 -0.265467 1.54076 0.162362L8.02483 4.3307C8.63716 4.72433 8.63716 5.61942 8.02483 6.01305L1.54076 10.1814C0.875246 10.6092 0 10.1314 0 9.34021L0 1.00354Z"
      fill={color}
    />
  </svg>
);

const ReasonText = ({
  change,
  className = '',
}: {
  change: CorrectionChange;
  className?: string;
}) => (
  <p className={`text-base leading-6 tracking-tight ${className}`}>
    {change.reason.split(change.corrected).map((part, i, arr) => (
      <Fragment key={i}>
        {part.split(change.original).map((subPart, j, subArr) => (
          <Fragment key={j}>
            {subPart}
            {j < subArr.length - 1 && <strong>'{change.original}'</strong>}
          </Fragment>
        ))}
        {i < arr.length - 1 && <strong>'{change.corrected}'</strong>}
      </Fragment>
    ))}
  </p>
);

// ── CorrectionCard 컴포넌트 ────────────────────────────────────────────

interface CorrectionCardProps {
  change: CorrectionChange & {
    action: FeedbackActionType | null;
    rejectReason?: string;
  };
  receiverType: ReceiverType;
  onAccept: () => void;
  onReject: (reason?: string) => void;
  onUndo: () => void;
  onAdvance: () => void;
}

const CorrectionCard = ({
  change,
  receiverType,
  onAccept,
  onReject,
  onUndo,
  onAdvance,
}: CorrectionCardProps) => {
  const isColleague = receiverType === 'OTHER_DEPT_COLLEAGUE';

  const [step, setStep] = useState<CardStep>(() => {
    if (change.action === 'ACCEPTED') return 'accepted';
    if (change.action === 'REJECTED') return 'rejected';
    return 'pending';
  });

  const [reason1, setReason1] = useState<RejectReason1 | null>(null);
  const [reason2, setReason2] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // 동료 타입: rejected + 배너 표시 시 카운트다운 → 자동 다음으로
  useEffect(() => {
    if (!showBanner) return;
    if (countdown <= 0) {
      onAdvance();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showBanner, countdown, onAdvance]);

  const chipBase =
    'flex items-center justify-center px-6 py-1 rounded-full text-base font-semibold leading-5.5 tracking-tight cursor-pointer transition-colors whitespace-nowrap';
  const chipDefault =
    'bg-background-subtle text-text-placeholder hover:bg-background-hover-2 hover:text-text-inverse';
  const chipSelected = 'bg-background-inverse text-text-inverse';

  const btnBase =
    'flex items-center justify-center gap-1 px-4 py-1 rounded-md text-sm font-medium leading-5 tracking-tight whitespace-nowrap transition-colors';

  // ── pending ──────────────────────────────────────────────────
  if (step === 'pending') {
    return (
      <div className="bg-background-surface flex flex-col gap-2.5 px-6 py-5 rounded-2xl shrink-0">
        <div className="flex flex-col gap-2.5">
          {/* 레이블 */}
          <div className="h-7 flex items-start">
            <div
              className={`flex items-center justify-center px-5 py-0.5 rounded text-base font-semibold leading-6 tracking-tight ${LABEL_CLASS[change.label]}`}
            >
              {CORRECTION_LABEL_INFO[change.label].label}
            </div>
          </div>
          {/* 원문 → 교정 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2.5 items-center p-2.5">
              <span className="line-through text-lg text-text-tertiary leading-7 tracking-tight whitespace-nowrap">
                {change.original}
              </span>
              <PlayArrow />
              <span className="flex-1 text-xl-plus font-semibold leading-[30px] tracking-tight text-text-primary whitespace-nowrap">
                {change.corrected}
              </span>
            </div>
            {/* 교정 이유 */}
            <div className="p-2.5">
              <ReasonText change={change} className="text-text-secondary" />
            </div>
          </div>
        </div>
        {/* 거절/수용 버튼 */}
        <div className="flex items-end justify-end gap-2">
          <button
            onClick={() => {
              if (isColleague) {
                // 동료: 즉시 거절 후 배너 표시
                onReject();
                setStep('rejected');
                setShowBanner(true);
                setCountdown(5);
              } else {
                setStep('rejecting');
              }
            }}
            className={`${btnBase} bg-background-muted text-text-tertiary hover:bg-background-hover`}
          >
            <Icon name="x" size={16} color="currentColor" />
            거절
          </button>
          <button
            onClick={() => {
              onAccept();
              setStep('accepted');
              setTimeout(() => onAdvance(), 800);
            }}
            className={`${btnBase} bg-background-inverse text-text-inverse hover:bg-background-hover-2`}
          >
            <Icon
              name="check"
              size={16}
              viewBox="0 0 16 16"
              color="currentColor"
            />
            수용
          </button>
        </div>
      </div>
    );
  }

  // ── accepted ─────────────────────────────────────────────────
  if (step === 'accepted') {
    return (
      <div
        className={`${step} bg-background-success-subtle border border-border-success flex flex-col gap-2.5 px-6 py-5 rounded-2xl shrink-0`}
      >
        <div className="flex flex-col gap-2.5">
          <div className="h-7 flex items-start">
            <div
              className={`flex items-center justify-center px-5 py-0.5 rounded text-base font-semibold leading-6 tracking-tight ${LABEL_CLASS[change.label]} bg-background-surface! text-text-success!`}
            >
              {CORRECTION_LABEL_INFO[change.label].label}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2.5 items-center p-2.5">
              <span className="line-through text-lg text-text-success leading-7 tracking-tight whitespace-nowrap">
                {change.original}
              </span>
              <PlayArrow color="var(--color-icon-success)" />
              <span className="flex-1 text-xl-plus font-semibold leading-[30px] tracking-tight text-text-success whitespace-nowrap">
                {change.corrected}
              </span>
            </div>
            <div className="p-2.5">
              <ReasonText change={change} className="text-text-secondary" />
            </div>
          </div>
        </div>
        <div className="flex items-end justify-end gap-2">
          <button
            onClick={() => {
              onUndo();
              setStep('pending');
            }}
            className={`${btnBase} bg-background-success-subtle text-text-success hover:opacity-80`}
          >
            <Icon
              name="redo"
              viewBox="0 0 16 16"
              size={16}
              color="currentColor"
            />
            되돌리기
          </button>
          <button
            disabled
            className={`${btnBase} bg-background-success-subtle text-text-success cursor-default`}
          >
            <Icon name="check-double" size={16} color="currentColor" />
            수용됨
          </button>
        </div>
      </div>
    );
  }

  // ── rejecting (1단계 + 2단계 통합) ─────────────────────────────
  if (step === 'rejecting') {
    // 저장 가능 여부:
    // - '의미가 달라졌어요': reason1만 선택해도 바로 저장 가능
    // - '내 스타일&상황과 안 맞아요': reason2도 선택해야 저장 가능
    // - '다른 이유가 있어요': textarea에 내용이 있어야 저장 가능
    const subReasons = reason1 ? REJECT_REASONS_2[reason1] : undefined;
    const showSubChips =
      reason1 === '내 스타일&상황과 안 맞아요' && subReasons !== null;
    const showTextarea = reason1 === '다른 이유가 있어요';
    const canSave =
      reason1 === '의미가 달라졌어요'
        ? true
        : showSubChips
          ? reason2 !== null
          : showTextarea
            ? customReason.trim().length > 0
            : false;
    const finalReason = showTextarea
      ? customReason.trim()
      : (reason2 ?? reason1 ?? '');

    return (
      <div className="bg-background-surface border border-border-default flex flex-col gap-5 px-6 py-5 rounded-2xl shrink-0">
        {/* 카드 상단 — pending과 동일하게 유지 */}
        <div className="flex flex-col gap-2.5">
          <div className="h-7 flex items-start">
            <div
              className={`flex items-center justify-center px-5 py-0.5 rounded text-base font-semibold leading-6 tracking-tight ${LABEL_CLASS[change.label]}`}
            >
              {CORRECTION_LABEL_INFO[change.label].label}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2.5 items-center p-2.5">
              <span className="line-through text-lg text-text-tertiary leading-7 tracking-tight whitespace-nowrap">
                {change.original}
              </span>
              <PlayArrow />
              <span className="flex-1 text-xl-plus font-semibold leading-[30px] tracking-tight text-text-primary whitespace-nowrap">
                {change.corrected}
              </span>
            </div>
            <div className="p-2.5">
              <ReasonText change={change} className="text-text-secondary" />
            </div>
          </div>
        </div>
        {/* 구분선 */}
        <div className="h-px bg-border-default" />
        {/* 거절 이유 선택 영역 */}
        <div className="flex flex-col gap-4">
          <p className="text-base font-semibold leading-6 tracking-tight text-text-secondary p-1">
            어떤 점이 마음에 들지 않았나요?
          </p>
          {/* 1단계 칩 */}
          <div className="flex flex-wrap gap-1">
            {REJECT_REASONS_1.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setReason1(r);
                  setReason2(null);
                  setCustomReason('');
                }}
                className={`${chipBase} ${reason1 === r ? chipSelected : chipDefault}`}
              >
                {r}
              </button>
            ))}
          </div>
          {/* 2단계: 두 번째 칩 선택 시 서브칩 바로 노출 */}
          {showSubChips && (
            <div className="flex flex-col gap-4">
              <p className="text-base font-semibold leading-6 tracking-tight text-text-secondary p-1">
                조금 더 구체적으로 알려주실 수 있나요?
              </p>
              <div className="flex flex-wrap gap-1">
                {subReasons!.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason2(r)}
                    className={`${chipBase} ${reason2 === r ? chipSelected : chipDefault}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* 2단계: 세 번째 칩 선택 시 textarea 바로 노출 */}
          {showTextarea && (
            <div className="flex flex-col gap-1 relative">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value.slice(0, 200))}
                placeholder="어떤 점이 불편했는지 자유롭게 적어주세요."
                className="w-full h-35.5 bg-background-subtle rounded-2xl px-6 py-5 text-lg font-medium leading-6 tracking-tight border border-border-default text-text-secondary placeholder:text-text-placeholder outline-none resize-none mt-3"
              />
              <div className="flex justify-end absolute right-0 bottom-0 p-4">
                <span className="text-sm text-text-tertiary leading-5.5 tracking-tight">
                  {customReason.length} / 200
                </span>
              </div>
            </div>
          )}
        </div>
        {/* 뒤로/저장하기 */}
        <div className="flex items-end justify-end gap-2">
          <button
            onClick={() => {
              setReason1(null);
              setReason2(null);
              setCustomReason('');
              setStep('pending');
            }}
            className={`${btnBase} bg-background-muted text-text-tertiary hover:bg-background-hover`}
          >
            뒤로
          </button>
          <button
            onClick={() => {
              if (!canSave) return;
              onReject(finalReason || undefined);
              setStep('rejected');
              setTimeout(() => onAdvance(), 800);
            }}
            disabled={!canSave}
            className={`${btnBase} ${
              canSave
                ? 'bg-background-inverse text-text-inverse hover:bg-background-hover-2'
                : 'bg-background-disabled text-text-disabled cursor-not-allowed'
            }`}
          >
            <Icon
              name="check"
              size={16}
              viewBox="0 0 16 16"
              color="currentColor"
            />
            저장하기
          </button>
        </div>
      </div>
    );
  }

  // ── rejected ─────────────────────────────────────────────────
  const savedReason = change.rejectReason;
  return (
    <div className="flex flex-col gap-2.5 shrink-0">
      <div className="bg-background-disabled border border-border-disabled flex flex-col gap-2.5 px-6 py-5 rounded-2xl">
        <div className="flex flex-col gap-2.5">
          <div className="h-7 flex items-start">
            <div
              className={`flex items-center justify-center px-5 py-0.5 rounded text-base font-semibold leading-6 tracking-tight ${LABEL_CLASS[change.label]} bg-background-surface! text-text-disabled!`}
            >
              {CORRECTION_LABEL_INFO[change.label].label}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2.5 items-center p-2.5 flex-wrap">
              <span className="line-through text-lg text-text-disabled leading-7 tracking-tight whitespace-nowrap">
                {change.original}
              </span>
              <PlayArrow color="var(--color-icon-disabled)" />
              <span className="text-xl-plus font-semibold leading-[30px] tracking-tight text-text-disabled whitespace-nowrap">
                {change.corrected}
              </span>
              {savedReason && (
                <>
                  <span className="text-text-disabled text-base">•</span>
                  <span className="text-sm text-text-disabled leading-5.5 tracking-tight">
                    {savedReason}
                  </span>
                </>
              )}
            </div>
            <div className="p-2.5">
              <ReasonText change={change} className="text-text-disabled" />
            </div>
          </div>
        </div>
        <div className="flex items-end justify-end gap-2">
          <button
            onClick={() => {
              onUndo();
              setStep('pending');
              setShowBanner(false);
            }}
            className={`${btnBase} bg-background-muted text-text-tertiary hover:bg-background-hover cursor-pointer`}
          >
            <Icon
              name="redo"
              viewBox="0 0 16 16"
              size={16}
              color="currentColor"
            />
            되돌리기
          </button>
          <button
            disabled
            className={`${btnBase} bg-background-disabled text-text-tertiary cursor-default`}
          >
            <Icon name="x" size={16} color="currentColor" />
            거부됨
          </button>
        </div>
      </div>

      {/* 동료 타입 배너 */}
      {showBanner && (
        <div className="bg-background-surface border border-border-default flex items-center gap-4 px-6 py-4 rounded-2xl">
          <Icon
            name="question"
            size={20}
            color="var(--color-icon-secondary)"
            className="shrink-0"
          />
          <div className="flex-1 flex flex-col">
            <p className="text-base font-semibold leading-6 tracking-tight text-text-secondary">
              왜 거절하셨는지 알려주실 수 있을까요?
            </p>
            <p className="text-sm text-text-tertiary leading-5.5 tracking-tight">
              {countdown > 0
                ? `${countdown}초 뒤 다음 검토로 넘어갑니다.`
                : '다음 검토로 넘어갑니다.'}
            </p>
          </div>
          <button
            onClick={() => {
              setShowBanner(false);
              setStep('rejecting');
            }}
            className="shrink-0 text-sm font-semibold text-text-brand hover:text-text-brand-strong transition-colors whitespace-nowrap"
          >
            네, 알려드릴게요.
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const EditorResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? MOCK_STATE;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [changes, setChanges] = useState<
    (CorrectionChange & {
      action: FeedbackActionType | null;
      rejectReason?: string;
    })[]
  >(() => state?.correctionData.changes ?? []);
  const [correctedEmail] = useState(
    () => state?.correctionData.corrected_email ?? ''
  );
  const [copied, setCopied] = useState(false);

  const { mutate: recorrect, isPending: isRecorrecting } = useRecorrect();
  const { mutate: confirmCorrection, isPending: isConfirming } =
    useConfirmCorrection();

  const { correctionData, originalEmail, receiverType, purposeType } = state;
  const totalChanges = changes.length;
  const acceptedCount = changes.filter((c) => c.action === 'ACCEPTED').length;
  const rejectedCount = changes.filter((c) => c.action === 'REJECTED').length;
  const pendingCount = changes.filter((c) => c.action === null).length;

  const autoCount = changes.filter((c) => c.label === 'AUTO').length;
  const suggestCount = changes.filter((c) => c.label === 'SUGGEST').length;
  const styleCount = changes.filter((c) => c.label === 'STYLE').length;

  const currentChange = changes[currentIndex];

  const handleAccept = useCallback(() => {
    setChanges((prev) =>
      prev.map((c, i) =>
        i === currentIndex ? { ...c, action: 'ACCEPTED' } : c
      )
    );
  }, [currentIndex]);

  const handleReject = useCallback(
    (reason?: string) => {
      setChanges((prev) =>
        prev.map((c, i) =>
          i === currentIndex
            ? { ...c, action: 'REJECTED', rejectReason: reason }
            : c
        )
      );
    },
    [currentIndex]
  );

  const handleUndo = useCallback(() => {
    setChanges((prev) =>
      prev.map((c, i) =>
        i === currentIndex ? { ...c, action: null, rejectReason: undefined } : c
      )
    );
  }, [currentIndex]);

  const handleAdvance = useCallback(() => {
    if (currentIndex < totalChanges - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, totalChanges]);

  const handleRecorrect = () => {
    const rejects = changes
      .filter((c) => c.action === 'REJECTED')
      .map((c) => ({ index: c.index }));

    recorrect(
      { sessionId: correctionData.session_id, data: { rejects } },
      {
        onSuccess: (data) => {
          setChanges(data.changes.map((c) => ({ ...c, action: null })));
          setCurrentIndex(0);
        },
      }
    );
  };

  const handleConfirm = () => {
    confirmCorrection({
      sessionId: correctionData.session_id,
      data: { final_email: correctedEmail },
    });
  };

  const handleCopyTitle = useCallback(() => {
    const firstLine = correctedEmail.split('\n')[0] || '';
    navigator.clipboard.writeText(firstLine);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [correctedEmail]);

  // ── 스크롤 싱크 ──────────────────────────────────────────────
  const originalScrollRef = useRef<HTMLDivElement>(null);
  const correctedScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false); // 무한 루프 방지 플래그

  const handleOriginalScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    const src = originalScrollRef.current;
    const dst = correctedScrollRef.current;
    if (!src || !dst) return;
    isSyncingRef.current = true;
    dst.scrollTop = src.scrollTop;
    isSyncingRef.current = false;
  }, []);

  const handleCorrectedScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    const src = correctedScrollRef.current;
    const dst = originalScrollRef.current;
    if (!src || !dst) return;
    isSyncingRef.current = true;
    dst.scrollTop = src.scrollTop;
    isSyncingRef.current = false;
  }, []);

  return (
    <main
      id="result"
      className="bg-background-page flex-1 flex flex-col overflow-hidden px-9 gap-5 py-0"
    >
      {/* ── 상단 정보 바 ── */}
      <div className="bg-background-surface flex gap-5 items-center justify-between overflow-hidden pb-5 pt-10 px-6 rounded-2xl shrink-0">
        {/* 상단 좌측 */}
        <div className="flex gap-5">
          {/* 이전 버튼 */}
          <button
            onClick={() =>
              navigate(ROUTES.EDITOR, {
                state: {
                  receiver: receiverType,
                  purpose: purposeType,
                  emailText: originalEmail,
                },
              })
            }
            className="flex gap-0.5 items-center justify-center px-4 py-1 rounded-md text-text-tertiary hover:text-text-primary transition-colors"
          >
            <Icon name="arrow-left" size={16} color="currentColor" />
            <span className="text-sm font-medium leading-5 tracking-tight">
              이전
            </span>
          </button>

          {/* 구분선 */}
          <div className="w-0.5 self-stretch rounded-full bg-border-default" />

          {/* 목적 + 수신자 라벨 */}
          <div className="flex gap-1.5 items-center">
            <div className="bg-[#dcebff] border border-[#b8d4ff] flex items-center justify-center px-2.5 py-0.5 rounded text-[#285ea8] text-base font-medium leading-6 tracking-tight whitespace-nowrap">
              {PURPOSE_LABELS[purposeType]}
            </div>
            <div className="bg-background-page border border-border-subtle flex items-center justify-center px-5 py-0.5 rounded text-text-secondary text-base font-semibold leading-6 tracking-tight whitespace-nowrap">
              {RECEIVER_TYPE_LABELS[receiverType]}
            </div>
          </div>
        </div>

        {/* 상단 우측 */}
        <div className="flex gap-5">
          {/* 교정 통계 */}
          <div className="">
            <span className="text-base font-semibold leading-7 text-text-tertiary tracking-tight whitespace-nowrap">
              교정 <span className="text-text-secondary">{totalChanges}건</span>
            </span>
          </div>
          <div className="flex gap-2 items-center">
            {autoCount > 0 && (
              <div className="required flex items-center justify-center px-5 py-0.5 rounded text-base font-semibold leading-6 tracking-tight whitespace-nowrap">
                필수 {autoCount}건
              </div>
            )}
            {suggestCount > 0 && (
              <div className="recommend flex items-center justify-center px-5 py-0.5 rounded text-base font-semibold leading-6 tracking-tight whitespace-nowrap">
                추천 {suggestCount}건
              </div>
            )}
            {styleCount > 0 && (
              <div className="reference flex items-center justify-center px-5 py-0.5 rounded text-base font-semibold leading-6 tracking-tight whitespace-nowrap">
                참고 {styleCount}건
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── AI 추천 제목 바 ── */}
      <div className="bg-background-surface flex gap-5 items-center px-8 shrink-0 rounded-2xl py-4">
        <div className="flex gap-1.5 items-center shrink-0">
          <Icon name="ai" size={24} color="var(--color-icon-info)" />
          <div className="flex items-center justify-center p-2.5">
            <span className="text-2xl font-bold leading-8 tracking-tight text-text-secondary whitespace-nowrap">
              추천 제목
            </span>
          </div>
        </div>
        <div className="flex-1 bg-background-subtle h-16.5 flex items-center justify-between px-6 py-5 rounded-lg">
          <span className="text-xl-plus font-semibold leading-7.5 tracking-tight text-text-secondary whitespace-nowrap truncate">
            {correctedEmail.split('\n')[0] ||
              '교정본 첫 줄이 제목으로 추천됩니다'}
          </span>
          <button
            onClick={handleCopyTitle}
            className="shrink-0 ml-4 text-icon-tertiary hover:text-icon-primary transition-colors"
          >
            <Icon
              name={copied ? 'check-bg' : 'copy'}
              size={24}
              color="currentColor"
            />
          </button>
        </div>
      </div>

      {/* ── 원문 / 교정본 비교 영역 ── */}
      <div className="flex-1 flex gap-4 py-6 border-b border-border-default max-lg:flex-col max-lg:py-0">
        {/* 원문 패널 */}
        <div className="flex-1 bg-background-surface flex flex-col gap-3.5 p-6 rounded-md min-w-0 overflow-hidden max-lg:border-b border-border-default">
          <div className="bg-background-page border border-border-default flex items-center justify-center px-5 py-0.5 rounded self-start text-text-secondary text-base font-semibold leading-6 tracking-tight">
            원문
          </div>
          <div
            ref={originalScrollRef}
            onScroll={handleOriginalScroll}
            className="flex-1 overflow-y-auto px-2.5"
          >
            <p className="text-lg font-semibold leading-9 tracking-tight text-text-secondary whitespace-pre-wrap">
              {renderWithHighlights(
                USE_FIXED_ORIGINAL ? MOCK_ORIGINAL : originalEmail,
                changes,
                currentIndex,
                'original',
                setCurrentIndex
              )}
            </p>
          </div>
          <div className="flex gap-1 items-center justify-end">
            <span className="text-sm leading-[22px] tracking-tight text-text-primary">
              {(USE_FIXED_ORIGINAL
                ? MOCK_ORIGINAL
                : originalEmail
              ).length.toLocaleString()}
            </span>
            <span className="text-sm leading-[22px] tracking-tight text-text-disabled">
              /
            </span>
            <span className="text-sm leading-[22px] tracking-tight text-text-tertiary">
              2,000
            </span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="w-px bg-border-strong rounded-full shrink-0" />

        {/* 교정본 패널 */}
        <div className="flex-1 bg-background-surface flex flex-col gap-3.5 p-6 rounded-md min-w-0 overflow-hidden">
          <div className="bg-[#dce8ff] border border-border-default flex items-center justify-center px-5 py-0.5 rounded self-start text-[#2954d6] text-base font-semibold leading-6 tracking-tight">
            교정본
          </div>
          <div
            ref={correctedScrollRef}
            onScroll={handleCorrectedScroll}
            className="flex-1 overflow-y-auto px-2.5"
          >
            <p className="text-lg font-semibold leading-9 tracking-tight text-text-secondary whitespace-pre-wrap">
              {renderWithHighlights(
                correctedEmail,
                changes,
                currentIndex,
                'corrected',
                setCurrentIndex
              )}
            </p>
          </div>
          <div className="flex gap-1 items-center justify-end">
            <span className="text-sm leading-[22px] tracking-tight text-text-primary">
              {correctedEmail.length.toLocaleString()}
            </span>
            <span className="text-sm leading-[22px] tracking-tight text-text-disabled">
              /
            </span>
            <span className="text-sm leading-[22px] tracking-tight text-text-tertiary">
              2,000
            </span>
          </div>
        </div>
      </div>

      {/* ── 교정 카드 ── */}
      {currentChange && (
        <CorrectionCard
          key={currentChange.index}
          change={currentChange}
          receiverType={receiverType}
          onAccept={handleAccept}
          onReject={handleReject}
          onUndo={handleUndo}
          onAdvance={handleAdvance}
        />
      )}

      {/* ── 하단 네비게이션 바 ── */}
      <div className="bg-background-surface flex items-center px-6 py-5 shrink-0 gap-6 rounded-t-2xl">
        {/* 이전/다음 화살표 */}
        <div className="flex gap-2 items-end">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="bg-background-muted flex items-center justify-center p-1 rounded-md disabled:opacity-40 cursor-pointer"
          >
            <Icon
              name="arrow-left"
              size={16}
              color="var(--color-icon-tertiary)"
            />
          </button>
          <button
            onClick={() =>
              setCurrentIndex((i) => Math.min(totalChanges - 1, i + 1))
            }
            disabled={currentIndex === totalChanges - 1}
            className="bg-background-muted flex items-center justify-center p-1 rounded-md disabled:opacity-40 cursor-pointer"
          >
            <Icon
              name="arrow-right"
              size={16}
              color="var(--color-icon-tertiary)"
            />
          </button>
        </div>

        {/* 현재/전체 */}
        <div className="px-2.5">
          <span className="text-xl font-semibold leading-7 tracking-tight text-text-secondary">
            {currentIndex + 1}/{totalChanges}
          </span>
        </div>

        {/* 수락/거절/미검토 카운트 */}
        <div className="flex gap-4 items-center px-2.5">
          <span className="text-xl font-semibold leading-7 tracking-tight text-text-placeholder">
            수락 {acceptedCount}
          </span>
          <span className="text-xl font-semibold leading-7 tracking-tight text-text-placeholder">
            거절 {rejectedCount}
          </span>
          <span className="text-xl font-semibold leading-7 tracking-tight text-text-placeholder">
            미검토 {pendingCount}
          </span>
        </div>

        {/* 우측: 안내 + 재교정 + 확정 */}
        <div className="flex-1 flex gap-2.5 items-center justify-end">
          {pendingCount > 0 && (
            <p className="text-base text-text-secondary leading-6 tracking-tight whitespace-nowrap">
              미검토된 교정 건은 확정 시 자동으로 수용됩니다
            </p>
          )}
          <button
            onClick={handleRecorrect}
            disabled={isRecorrecting || rejectedCount === 0}
            className="bg-background-muted flex-1 max-w-[140px] flex items-center justify-center px-5 py-2 rounded-md text-base font-medium text-text-tertiary leading-6 tracking-tight whitespace-nowrap disabled:opacity-40 hover:bg-background-hover transition-colors"
          >
            재교정
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="bg-background-inverse flex-1 max-w-[140px] flex items-center justify-center px-5 py-2 rounded-md text-base font-medium text-text-inverse leading-6 tracking-tight whitespace-nowrap disabled:opacity-40 hover:bg-background-hover-2 transition-colors"
          >
            교정안 확정
          </button>
        </div>
      </div>
    </main>
  );
};

export default EditorResultPage;
