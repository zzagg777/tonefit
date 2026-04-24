import { useState, useCallback, type ReactElement } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SidebarNav from '@/components/layout/SidebarNav';
import { Icon } from '@/components/ui';
import {
  ROUTES,
  CORRECTION_LABEL_INFO,
  RECEIVER_TYPE_LABELS,
  PURPOSE_LABELS,
} from '@/constants';
import { useRecorrect, useConfirmCorrection } from '@/queries';
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
  originalEmail:
    '김철수 팀장님께,\n안녕하십니까, 마케팅팀 윤서연입니다.\n웹사이트 리뉴얼 프로젝트 관련하여 보고드리겠습니다.\n외주업체에서 보내드리실 견적서가 아직 도착하지 않아 일정이 지연되고 있는 상황입니다.\n확인되어졌으며, 빠른 시일 내에 전달드리도록 하겠습니다.\n검토 부탁드리실게요.',
  receiverType: 'DIRECT_SUPERVISOR',
  purposeType: 'REPORT',
  correctionData: {
    session_id: 1,
    round: 1,
    corrected_email:
      '김철수 팀장님께,\n안녕하십니까, 마케팅팀 윤서연입니다.\n웹사이트 리뉴얼 프로젝트 관련하여 보고드리겠습니다.\n외주업체에서 보내줄 견적서가 아직 도착하지 않아 일정이 지연되고 있는 상황입니다.\n확인되었으며, 빠른 시일 내로 전달드리겠습니다.\n검토 부탁드리겠습니다.',
    changes: [
      {
        index: 0,
        start: 93,
        end: 100,
        original: '보내드리실',
        corrected: '보내줄',
        reason:
          "상대방의 행동에 대한 과도한 높임 표현인 '드리실'은 비즈니스 문법에 어긋납니다. '보내줄' 또는 '보내주실'로 수정하는 것이 자연스럽습니다.",
        label: 'AUTO',
        action: null,
      },
      {
        index: 1,
        start: 131,
        end: 138,
        original: '확인되어졌으며',
        corrected: '확인되었으며',
        reason:
          "'되어졌다'는 이중 피동 표현으로 비문입니다. '확인되었으며'로 수정해야 합니다.",
        label: 'AUTO',
        action: null,
      },
      {
        index: 2,
        start: 149,
        end: 156,
        original: '전달드리도록 하겠습니다',
        corrected: '전달드리겠습니다',
        reason:
          "'~도록 하겠습니다'는 불필요한 표현입니다. '전달드리겠습니다'로 간결하게 수정하는 것이 좋습니다.",
        label: 'SUGGEST',
        action: null,
      },
      {
        index: 3,
        start: 157,
        end: 168,
        original: '검토 부탁드리실게요',
        corrected: '검토 부탁드리겠습니다',
        reason:
          "'부탁드리실게요'는 맞춤법에 어긋난 표현입니다. '부탁드리겠습니다'로 수정하세요.",
        label: 'AUTO',
        action: null,
      },
    ],
    created_at: new Date().toISOString(),
  },
};

// 교정 레이블별 색상
const LABEL_COLORS: Record<
  CorrectionLabelType,
  { bg: string; border: string; text: string }
> = {
  AUTO: {
    bg: 'bg-[#fdecec]',
    border: 'border-border-danger',
    text: 'text-text-danger',
  },
  SUGGEST: {
    bg: 'bg-[#fff6e5]',
    border: 'border-border-warning',
    text: 'text-text-warning',
  },
  STYLE: {
    bg: 'bg-[#d9f2e1]',
    border: 'border-border-success',
    text: 'text-text-success',
  },
};

// 텍스트에서 변경 항목을 하이라이트 렌더링
const renderWithHighlights = (
  text: string,
  changes: (CorrectionChange & { action: FeedbackActionType | null })[],
  activeIndex: number,
  mode: 'original' | 'corrected'
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
      const colors = LABEL_COLORS[part.change.label];
      return (
        <mark
          key={i}
          className={`
            rounded-full px-1 border
            ${colors.bg} ${colors.border}
            ${part.isActive ? 'opacity-100' : 'opacity-40'}
          `}
          style={{ backgroundColor: 'inherit' }}
        >
          {part.text}
        </mark>
      );
    });
  }

  // 교정본: corrected 문자열 검색 후 하이라이트
  let remaining = text;
  const parts: ReactElement[] = [];
  let keyIdx = 0;

  for (const change of changes) {
    const target = change.corrected;
    const idx = remaining.indexOf(target);
    if (idx === -1) continue;
    if (idx > 0) {
      parts.push(<span key={keyIdx++}>{remaining.slice(0, idx)}</span>);
    }
    const colors = LABEL_COLORS[change.label];
    parts.push(
      <mark
        key={keyIdx++}
        className={`
          rounded-full px-1 border
          ${colors.bg} ${colors.border}
          ${change.index === activeIndex ? 'opacity-100' : 'opacity-40'}
        `}
        style={{ backgroundColor: 'inherit' }}
      >
        {target}
      </mark>
    );
    remaining = remaining.slice(idx + target.length);
  }
  if (remaining) parts.push(<span key={keyIdx++}>{remaining}</span>);

  return parts;
};

const EditorResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? MOCK_STATE;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [changes, setChanges] = useState<
    (CorrectionChange & { action: FeedbackActionType | null })[]
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

  const handleAccept = () => {
    setChanges((prev) =>
      prev.map((c, i) =>
        i === currentIndex ? { ...c, action: 'ACCEPTED' } : c
      )
    );
    if (currentIndex < totalChanges - 1) setCurrentIndex((i) => i + 1);
  };

  const handleReject = () => {
    setChanges((prev) =>
      prev.map((c, i) =>
        i === currentIndex ? { ...c, action: 'REJECTED' } : c
      )
    );
    if (currentIndex < totalChanges - 1) setCurrentIndex((i) => i + 1);
  };

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
          // 재교정 시 교정본도 업데이트 (API가 new corrected_email을 내려줄 경우 여기서 처리)
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
    // AI 추천 제목 복사 (실제 제목은 API에서 오지만 여기서는 correctedEmail 첫 줄 사용)
    const firstLine = correctedEmail.split('\n')[0] || '';
    navigator.clipboard.writeText(firstLine);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [correctedEmail]);

  const actionBtnBase =
    'flex items-center justify-center gap-0.5 px-4 py-1 rounded-md text-sm font-medium leading-5 tracking-tight whitespace-nowrap transition-colors';

  return (
    <div className="flex h-screen bg-background-page overflow-hidden">
      <SidebarNav />

      <div className="flex-1 flex flex-col overflow-hidden px-9 gap-5 py-0">
        {/* ── 상단 정보 바 ── */}
        <div className="bg-background-surface flex gap-5 items-center overflow-hidden pb-5 pt-10 px-6 rounded-2xl shrink-0">
          {/* 이전 버튼 */}
          <button
            onClick={() => navigate(ROUTES.EDITOR)}
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

          {/* 교정 통계 */}
          <div className="flex gap-4 items-center px-2.5">
            <span className="text-base font-semibold leading-7 text-text-secondary tracking-tight whitespace-nowrap">
              교정 <span className="text-text-secondary">{totalChanges}건</span>
            </span>
          </div>
          <div className="flex gap-2 items-center">
            {autoCount > 0 && (
              <div className="bg-[#fdecec] flex items-center justify-center px-5 py-0.5 rounded text-text-danger text-base font-semibold leading-6 tracking-tight whitespace-nowrap">
                필수 {autoCount}건
              </div>
            )}
            {suggestCount > 0 && (
              <div className="bg-[#fff6e5] flex items-center justify-center px-5 py-0.5 rounded text-text-warning text-base font-semibold leading-6 tracking-tight whitespace-nowrap">
                추천 {suggestCount}건
              </div>
            )}
            {styleCount > 0 && (
              <div className="bg-[#d9f2e1] flex items-center justify-center px-5 py-0.5 rounded text-text-success text-base font-semibold leading-6 tracking-tight whitespace-nowrap">
                참고 {styleCount}건
              </div>
            )}
          </div>
        </div>

        {/* ── AI 추천 제목 바 ── */}
        <div className="bg-background-surface flex gap-5 items-center px-8 shrink-0 rounded-2xl py-4">
          <div className="flex gap-1.5 items-center shrink-0">
            <Icon name="pencil-ai" size={24} color="var(--color-icon-brand)" />
            <div className="flex items-center justify-center p-2.5">
              <span className="text-2xl font-bold leading-8 tracking-tight text-text-secondary whitespace-nowrap">
                추천 제목
              </span>
            </div>
          </div>
          <div className="flex-1 bg-background-subtle h-[66px] flex items-center justify-between px-6 py-5 rounded-lg">
            <span className="text-[22px] font-semibold leading-[30px] tracking-tight text-text-secondary whitespace-nowrap truncate">
              {correctedEmail.split('\n')[0] ||
                '교정본 첫 줄이 제목으로 추천됩니다'}
            </span>
            <button
              onClick={handleCopyTitle}
              className="shrink-0 ml-4 text-icon-tertiary hover:text-icon-primary transition-colors"
            >
              <Icon
                name={copied ? 'check' : 'copy'}
                size={24}
                color="currentColor"
              />
            </button>
          </div>
        </div>

        {/* ── 원문 / 교정본 비교 영역 ── */}
        <div className="flex-1 flex gap-4 min-h-0 pb-0">
          {/* 원문 패널 */}
          <div className="flex-1 bg-background-surface flex flex-col gap-3.5 p-6 rounded-md min-w-0 overflow-hidden">
            <div className="bg-background-page border border-border-default flex items-center justify-center px-5 py-0.5 rounded self-start text-text-secondary text-base font-semibold leading-6 tracking-tight">
              원문
            </div>
            <div className="flex-1 overflow-y-auto px-2.5">
              <p className="text-lg font-semibold leading-9 tracking-tight text-text-secondary whitespace-pre-wrap">
                {renderWithHighlights(
                  originalEmail,
                  changes,
                  currentIndex,
                  'original'
                )}
              </p>
            </div>
            <div className="flex gap-1 items-center justify-end">
              <span className="text-sm leading-[22px] tracking-tight text-text-primary">
                {originalEmail.length.toLocaleString()}
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
            <div className="flex-1 overflow-y-auto px-2.5">
              <p className="text-lg font-semibold leading-9 tracking-tight text-text-secondary whitespace-pre-wrap">
                {renderWithHighlights(
                  correctedEmail,
                  changes,
                  currentIndex,
                  'corrected'
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
          <div className="bg-background-surface flex flex-col gap-2.5 px-6 py-5 rounded-2xl shrink-0">
            <div className="flex flex-col gap-2.5">
              {/* 레이블 */}
              <div className="h-7 flex items-start">
                <div
                  className={`flex items-center justify-center px-5 py-0.5 rounded text-base font-semibold leading-6 tracking-tight ${LABEL_COLORS[currentChange.label].bg} ${LABEL_COLORS[currentChange.label].text}`}
                >
                  {CORRECTION_LABEL_INFO[currentChange.label].label}
                </div>
              </div>

              {/* 원문 → 교정본 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2.5 items-center p-2.5">
                  <span className="line-through text-lg text-text-tertiary leading-7 tracking-tight whitespace-nowrap">
                    {currentChange.original}
                  </span>
                  <Icon
                    name="arrow-right"
                    size={16}
                    color="var(--color-icon-tertiary)"
                  />
                  <span className="flex-1 text-[22px] font-semibold leading-[30px] tracking-tight text-text-primary whitespace-nowrap">
                    {currentChange.corrected}
                  </span>
                </div>

                {/* 교정 이유 */}
                <div className="p-2.5">
                  <p className="text-base text-text-secondary leading-6 tracking-tight">
                    {currentChange.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-end justify-end gap-2">
              <button
                onClick={handleReject}
                className={`${actionBtnBase} bg-background-muted text-text-tertiary hover:bg-background-hover`}
              >
                <Icon name="x" size={16} color="currentColor" />
                삭제
              </button>
              <button
                onClick={handleAccept}
                className={`${actionBtnBase} bg-background-inverse text-text-inverse hover:bg-background-hover-2`}
              >
                <Icon name="check" size={16} color="currentColor" />
                수용
              </button>
            </div>
          </div>
        )}

        {/* ── 하단 네비게이션 바 ── */}
        <div className="bg-background-surface flex items-center px-6 py-5 shrink-0 gap-6 rounded-t-2xl">
          {/* 이전/다음 화살표 */}
          <div className="flex gap-2 items-end">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="bg-background-muted flex items-center justify-center p-1 rounded-md disabled:opacity-40"
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
              className="bg-background-muted flex items-center justify-center p-1 rounded-md disabled:opacity-40"
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
      </div>
    </div>
  );
};

export default EditorResultPage;
