import { useState, useCallback, type ReactElement } from 'react';
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

const labelCls = 'rounded-full px-1 py-0.5 border !text-text-secondary';
const LABEL_CLASS: Record<CorrectionLabelType, string> = {
  AUTO: 'required',
  SUGGEST: 'recommend',
  STYLE: 'reference',
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
      return (
        <mark
          key={i}
          className={`${labelCls} ${LABEL_CLASS[part.change.label]}`}
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
    parts.push(
      <mark
        key={keyIdx++}
        className={`${labelCls} ${LABEL_CLASS[change.label]}`}
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
        <div className="flex-1 bg-background-subtle h-[66px] flex items-center justify-between px-6 py-5 rounded-lg">
          <span className="text-xl-plus font-semibold leading-[30px] tracking-tight text-text-secondary whitespace-nowrap truncate">
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
      <div className="flex-1 flex gap-4 min-h-0 max-h-137.5 py-6 border-b border-border-default">
        {/* 원문 패널 */}
        <div className="flex-1 bg-background-surface flex flex-col gap-3.5 p-6 rounded-md min-w-0 overflow-hidden">
          <div className="bg-background-page border border-border-default flex items-center justify-center px-5 py-0.5 rounded self-start text-text-secondary text-base font-semibold leading-6 tracking-tight">
            원문
          </div>
          <div className="flex-1 overflow-y-auto px-2.5">
            <p className="text-lg font-semibold leading-9 tracking-tight text-text-secondary whitespace-pre-wrap">
              {renderWithHighlights(
                USE_FIXED_ORIGINAL ? MOCK_ORIGINAL : originalEmail,
                changes,
                currentIndex,
                'original'
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
                className={`flex items-center justify-center px-5 py-0.5 rounded text-base font-semibold leading-6 tracking-tight ${LABEL_CLASS[currentChange.label]}`}
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
                {/* <Icon
                  name="play"
                  size={16}
                  color="var(--color-icon-secondary)"
                /> */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="9"
                  height="11"
                  viewBox="0 0 9 11"
                  fill="none"
                >
                  <path
                    d="M0 1.00354C0 0.212376 0.875246 -0.265467 1.54076 0.162362L8.02483 4.3307C8.63716 4.72433 8.63716 5.61942 8.02483 6.01305L1.54076 10.1814C0.875246 10.6092 0 10.1314 0 9.34021L0 1.00354Z"
                    fill="#374151"
                  />
                </svg>
                <span className="flex-1 text-xl-plus font-semibold leading-[30px] tracking-tight text-text-primary whitespace-nowrap">
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="10"
                viewBox="0 0 13 10"
                fill="none"
              >
                <path
                  d="M11.6667 1L4.33333 8.33333L1 5"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
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
