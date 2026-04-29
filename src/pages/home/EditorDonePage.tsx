import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@/components/ui';
import {
  ROUTES,
  CORRECTION_LABEL_INFO,
  RECEIVER_TYPE_LABELS,
  PURPOSE_LABELS,
} from '@/constants';
import { MOCK_CORRECTION_RESPONSE } from '@/mocks/handlers';
import type {
  CorrectionChange,
  FeedbackActionType,
  ReceiverType,
  PurposeType,
  CorrectionLabelType,
} from '@/types';

// ──────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────

type CopyState = 'idle' | 'copying' | 'success';

interface DoneLocationState {
  sessionId: number;
  finalEmail: string;
  receiverType: ReceiverType;
  purposeType: PurposeType;
  changes: (CorrectionChange & { action: FeedbackActionType | null })[];
}

// ──────────────────────────────────────────────
// 개발용 Mock 상태
// ──────────────────────────────────────────────

const MOCK_STATE: DoneLocationState = {
  sessionId: 1,
  finalEmail: MOCK_CORRECTION_RESPONSE.corrected_email,
  receiverType: 'DIRECT_SUPERVISOR',
  purposeType: 'REPORT',
  changes: MOCK_CORRECTION_RESPONSE.changes.map((c, i) => ({
    ...c,
    action: i % 3 === 2 ? ('REJECTED' as const) : ('ACCEPTED' as const),
  })),
};

// ──────────────────────────────────────────────
// 교정 라벨 → CSS 클래스
// ──────────────────────────────────────────────

const LABEL_CLASS: Record<CorrectionLabelType, string> = {
  AUTO: 'required',
  SUGGEST: 'recommend',
  STYLE: 'reference',
};

// ──────────────────────────────────────────────
// 액션 → 뱃지 텍스트/클래스
// ──────────────────────────────────────────────

const getActionLabel = (action: FeedbackActionType | null) => {
  if (action === 'REJECTED') return '원문유지';
  return '적용';
};

const getActionClass = (action: FeedbackActionType | null) => {
  if (action === 'REJECTED') {
    return 'bg-background-subtle text-text-tertiary border border-border-default';
  }
  return 'bg-background-success-subtle text-text-success border border-border-success';
};

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────

const EditorDonePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as DoneLocationState | null) ?? MOCK_STATE;

  const { receiverType, purposeType, changes } = state;

  const [emailText, setEmailText] = useState(state.finalEmail);
  const [titleCopied, setTitleCopied] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [toast, setToast] = useState<string | null>(null);

  const lastCopyAtRef = useRef<number>(0);
  const copySuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (copySuccessTimerRef.current)
        clearTimeout(copySuccessTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // ── 통계 ──
  const totalChanges = changes.length;
  const autoCount = changes.filter((c) => c.label === 'AUTO').length;
  const suggestCount = changes.filter((c) => c.label === 'SUGGEST').length;
  const styleCount = changes.filter((c) => c.label === 'STYLE').length;
  const acceptedCount = changes.filter(
    (c) => c.action === 'ACCEPTED' || c.action === null
  ).length;
  const rejectedCount = changes.filter((c) => c.action === 'REJECTED').length;

  const suggestedTitle = emailText.split('\n')[0] || '';

  // ── 토스트 헬퍼 ──
  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ── AI 추천 제목 복사 ──
  const handleTitleCopy = useCallback(() => {
    navigator.clipboard.writeText(suggestedTitle).catch(() => {});
    setTitleCopied(true);
    setTimeout(() => setTitleCopied(false), 2000);
  }, [suggestedTitle]);

  // ── 확정본 복사 (디바운스 + 3-state) ──
  const handleCopy = useCallback(async () => {
    const now = Date.now();
    if (now - lastCopyAtRef.current < 500) return; // 0.5s 디바운스
    lastCopyAtRef.current = now;

    if (!emailText.trim()) return;

    setCopyState('copying');
    try {
      await navigator.clipboard.writeText(emailText);
      setCopyState('success');
      showToast('최종 교정본이 복사되었습니다');
      if (copySuccessTimerRef.current)
        clearTimeout(copySuccessTimerRef.current);
      copySuccessTimerRef.current = setTimeout(
        () => setCopyState('idle'),
        2000
      );
    } catch {
      setCopyState('idle');
      showToast('복사에 실패했습니다');
    }
  }, [emailText, showToast]);

  // ── 복사 버튼 스타일 ──
  const copyBtnClass = (() => {
    const base =
      'w-full h-18 rounded-2xl text-xl font-bold leading-7 tracking-tight flex items-center justify-center gap-2 transition-colors';
    if (copyState === 'copying')
      return `${base} bg-background-pressed text-text-tertiary cursor-not-allowed`;
    if (copyState === 'success')
      return `${base} bg-background-success-subtle text-text-success`;
    // idle
    return `${base} bg-background-inverse text-text-inverse hover:bg-background-hover-2 disabled:opacity-40 disabled:cursor-not-allowed`;
  })();

  return (
    <main
      id="done"
      className="bg-background-page flex-1 flex flex-col overflow-hidden px-9 gap-5 py-0"
    >
      {/* ── 상단 정보 바 ── */}
      <div className="bg-background-surface flex gap-5 items-center justify-between overflow-hidden pb-5 pt-10 px-6 rounded-2xl shrink-0">
        {/* 목적 + 수신자 라벨 */}
        <div className="flex gap-1.5 items-center">
          <div className="bg-[#dcebff] border border-[#b8d4ff] flex items-center justify-center px-2.5 py-0.5 rounded text-[#285ea8] text-base font-medium leading-6 tracking-tight whitespace-nowrap">
            {PURPOSE_LABELS[purposeType]}
          </div>
          <div className="bg-background-page border border-border-subtle flex items-center justify-center px-5 py-0.5 rounded text-text-secondary text-base font-semibold leading-6 tracking-tight whitespace-nowrap">
            {RECEIVER_TYPE_LABELS[receiverType]}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2.5">
          <button
            onClick={() => navigate(ROUTES.HISTORY)}
            className="flex gap-1.5 items-center justify-center px-4 py-2 rounded-lg bg-background-subtle text-text-secondary hover:bg-background-hover transition-colors text-sm font-medium leading-5 tracking-tight whitespace-nowrap"
          >
            <Icon name="library" size={16} color="currentColor" />
            라이브러리 이동
          </button>
          <button
            onClick={() => navigate(ROUTES.EDITOR)}
            className="flex gap-1.5 items-center justify-center px-4 py-2 rounded-lg bg-background-inverse text-text-inverse hover:bg-background-hover-2 transition-colors text-sm font-medium leading-5 tracking-tight whitespace-nowrap"
          >
            <Icon name="plus" size={16} color="currentColor" />새 교정 시작하기
          </button>
        </div>
      </div>

      {/* ── 메인 2단 레이아웃 ── */}
      <div className="flex-1 flex gap-4 min-h-0 pb-6">
        {/* ── 좌측: AI 추천 제목 + 편집 가능 교정본 ── */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* AI 추천 제목 바 */}
          <div className="bg-background-surface flex gap-5 items-center px-8 shrink-0 rounded-2xl py-4">
            <div className="flex gap-1.5 items-center shrink-0">
              <Icon name="ai" size={24} color="var(--color-icon-info)" />
              <div className="flex items-center justify-center p-2.5">
                <span className="text-2xl font-bold leading-8 tracking-tight text-text-secondary whitespace-nowrap">
                  추천 제목
                </span>
              </div>
            </div>
            <div className="flex-1 bg-background-subtle h-[66px] flex items-center justify-between px-6 py-5 rounded-lg min-w-0">
              <span className="text-xl-plus font-semibold leading-[30px] tracking-tight text-text-secondary whitespace-nowrap truncate">
                {suggestedTitle || '교정본 첫 줄이 제목으로 추천됩니다'}
              </span>
              <button
                onClick={handleTitleCopy}
                className="shrink-0 ml-4 text-icon-tertiary hover:text-icon-primary transition-colors"
                aria-label="제목 복사"
              >
                <Icon
                  name={titleCopied ? 'check' : 'copy'}
                  size={24}
                  color="currentColor"
                />
              </button>
            </div>
          </div>

          {/* 편집 가능한 교정본 영역 */}
          <div className="flex-1 bg-background-surface flex flex-col gap-3.5 p-6 rounded-md min-h-0 overflow-hidden">
            <div className="bg-[#dce8ff] border border-border-default flex items-center justify-center px-5 py-0.5 rounded self-start text-[#2954d6] text-base font-semibold leading-6 tracking-tight whitespace-nowrap">
              교정본
            </div>
            <textarea
              className="flex-1 resize-none bg-transparent text-lg font-semibold leading-9 tracking-tight text-text-secondary outline-none overflow-y-auto px-2.5 w-full min-h-0"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              aria-label="교정된 이메일 본문 (수정 가능)"
            />
            <div className="flex gap-1 items-center justify-end shrink-0">
              <span className="text-sm leading-[22px] tracking-tight text-text-primary">
                {emailText.length.toLocaleString()}
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

        {/* ── 우측: 교정 요약 카드 ── */}
        <div className="w-[510px] shrink-0 bg-background-surface rounded-2xl flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="px-6 pt-6 pb-4 shrink-0 border-b border-border-default">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold leading-8 tracking-tight text-text-primary">
                교정 요약
              </h2>
              <span className="text-xl font-semibold leading-7 tracking-tight text-text-secondary">
                총 {totalChanges}건 완료
              </span>
            </div>

            {/* 필수/추천/참고 분류 */}
            <div className="flex gap-1.5 mt-3 items-center flex-wrap">
              {autoCount > 0 && (
                <div className="required flex items-center justify-center px-3 py-0.5 rounded text-sm font-semibold leading-5 tracking-tight">
                  필수 {autoCount}건
                </div>
              )}
              {suggestCount > 0 && (
                <div className="recommend flex items-center justify-center px-3 py-0.5 rounded text-sm font-semibold leading-5 tracking-tight">
                  추천 {suggestCount}건
                </div>
              )}
              {styleCount > 0 && (
                <div className="reference flex items-center justify-center px-3 py-0.5 rounded text-sm font-semibold leading-5 tracking-tight">
                  참고 {styleCount}건
                </div>
              )}
              <span className="ml-auto text-sm font-medium text-text-tertiary leading-5 tracking-tight whitespace-nowrap">
                수용 {acceptedCount} · 유지 {rejectedCount}
              </span>
            </div>
          </div>

          {/* 교정 항목 목록 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
            {changes.map((change) => (
              <div
                key={change.index}
                className="flex items-center gap-3 p-3 bg-background-subtle rounded-lg"
              >
                {/* 라벨 뱃지 */}
                <div
                  className={`shrink-0 flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold leading-4 tracking-tight ${LABEL_CLASS[change.label]}`}
                >
                  {CORRECTION_LABEL_INFO[change.label].label}
                </div>

                {/* 원문 → 교정 텍스트 */}
                <div className="flex-1 flex items-center gap-1.5 min-w-0 overflow-hidden">
                  <span className="line-through text-sm text-text-tertiary leading-5 tracking-tight shrink-0 max-w-[120px] truncate">
                    {change.original}
                  </span>
                  {/* 미니 화살표 */}
                  <svg
                    width="6"
                    height="8"
                    viewBox="0 0 9 11"
                    fill="none"
                    className="shrink-0"
                  >
                    <path
                      d="M0 1.00354C0 0.212376 0.875246 -0.265467 1.54076 0.162362L8.02483 4.3307C8.63716 4.72433 8.63716 5.61942 8.02483 6.01305L1.54076 10.1814C0.875246 10.6092 0 10.1314 0 9.34021L0 1.00354Z"
                      fill="#9CA3AF"
                    />
                  </svg>
                  <span className="text-sm font-medium text-text-primary leading-5 tracking-tight truncate">
                    {change.corrected}
                  </span>
                </div>

                {/* 액션 상태 뱃지 */}
                <div
                  className={`shrink-0 flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold leading-4 tracking-tight ${getActionClass(change.action)}`}
                >
                  {getActionLabel(change.action)}
                </div>
              </div>
            ))}
          </div>

          {/* 확정본 복사하기 버튼 */}
          <div className="px-6 pb-6 pt-2 shrink-0">
            <button
              onClick={handleCopy}
              disabled={copyState === 'copying' || !emailText.trim()}
              className={copyBtnClass}
              aria-label="확정본 복사하기"
            >
              {copyState === 'copying' && (
                <Icon name="loading" size={22} color="currentColor" />
              )}
              {copyState === 'success' && (
                <Icon name="check-circle" size={22} color="currentColor" />
              )}
              <span>
                {copyState === 'idle' && '확정본 복사하기'}
                {copyState === 'copying' && '복사 중...'}
                {copyState === 'success' && '복사 완료'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 토스트 알림 ── */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-background-inverse text-text-inverse px-6 py-3 rounded-full text-base font-semibold leading-6 tracking-tight shadow-lg whitespace-nowrap pointer-events-none">
          {toast}
        </div>
      )}
    </main>
  );
};

export default EditorDonePage;
