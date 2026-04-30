import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon, ButtonAction } from '@/components/ui';
import {
  ROUTES,
  // CORRECTION_LABEL_INFO,
  RECEIVER_TYPE_LABELS,
  PURPOSE_LABELS,
} from '@/constants';
import { MOCK_CORRECTION_RESPONSE } from '@/mocks/handlers';
import type {
  CorrectionChange,
  FeedbackActionType,
  ReceiverType,
  PurposeType,
  // CorrectionLabelType,
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

// true: 복사 항상 실패 (실패 토스트 테스트용)
const DEV_FORCE_COPY_FAIL = false;

// ──────────────────────────────────────────────
// 교정 라벨 → CSS 클래스
// ──────────────────────────────────────────────

// const LABEL_CLASS: Record<CorrectionLabelType, string> = {
//   AUTO: 'required',
//   SUGGEST: 'recommend',
//   STYLE: 'reference',
// };

// ──────────────────────────────────────────────
// 액션 → 뱃지 텍스트/클래스
// ──────────────────────────────────────────────

const getActionLabel = (action: FeedbackActionType | null) => {
  if (action === 'REJECTED') return '원문유지';
  return '적용';
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
  // const acceptedCount = changes.filter(
  //   (c) => c.action === 'ACCEPTED' || c.action === null
  // ).length;
  // const rejectedCount = changes.filter((c) => c.action === 'REJECTED').length;

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
      if (DEV_FORCE_COPY_FAIL) throw new Error('DEV: forced copy failure');
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
      'w-full h-18 rounded-2xl text-2xl font-bold leading-7 tracking-tight flex items-center justify-center gap-2 transition-colors cursor-pointer';
    if (copyState === 'copying')
      return `${base} bg-background-pressed text-text-tertiary cursor-not-allowed`;
    if (copyState === 'success')
      return `${base} bg-background-success-subtle text-text-success`;
    // idle
    return `${base} bg-background-inverse text-text-inverse hover:bg-background-hover-2 disabled:opacity-40 disabled:cursor-not-allowed`;
  })();

  const labelBox =
    'flex items-center justify-between py-2 gap-5 rounded text-base font-semibold leading-5 tracking-tight text-text-secondary';
  // 라벨 스타일
  const labelBase = `py-0.5 px-5 w-24.5 text-center leading-6 rounded-sm`;

  return (
    <main
      id="done"
      className="bg-background-page flex-1 flex flex-col overflow-hidden py-0"
    >
      {/* ── 상단 정보 바 ── */}
      <div className="bg-background-surface flex gap-5 items-center justify-between overflow-hidden py-5 px-6 rounded-2xl shrink-0">
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
          <ButtonAction
            variant="muted"
            size="lg"
            leftIcon="redo"
            iconViewBox="0 0 16 16"
            className="bg-background-surface"
            onClick={() => navigate(ROUTES.HISTORY)}
          >
            라이브러리 이동
          </ButtonAction>
          <ButtonAction
            variant="muted"
            size="lg"
            leftIcon="plus"
            className="bg-background-surface"
            onClick={() => navigate(ROUTES.EDITOR)}
          >
            새 교정 시작하기
          </ButtonAction>
        </div>
      </div>

      {/* ── 메인 2단 레이아웃 ── */}
      <div className="flex-1 flex gap-1 min-h-0 pb-6 max-lg:flex-col relative max-lg:pb-28">
        {/* ── 좌측: AI 추천 제목 + 편집 가능 교정본 ── */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* AI 추천 제목 바 */}
          <div className="bg-background-surface flex gap-5 items-center p-8 shrink-0 rounded-2xl">
            <div className="flex gap-1.5 items-center shrink-0">
              <Icon name="ai" size={24} color="var(--color-icon-info)" />
              <div className="flex items-center justify-center p-2.5">
                <span className="text-2xl font-bold leading-8 tracking-tight text-text-secondary whitespace-nowrap">
                  추천 제목
                </span>
              </div>
            </div>
            <div className="flex-1 bg-background-subtle flex items-center justify-between px-6 py-5 rounded-lg min-w-0">
              <span className="text-xl-plus font-semibold leading-7.5 tracking-tight text-text-secondary whitespace-nowrap truncate">
                {suggestedTitle || '교정본 첫 줄이 제목으로 추천됩니다'}
              </span>
              <button
                onClick={handleTitleCopy}
                className="shrink-0 ml-4 text-icon-tertiary hover:text-icon-primary transition-colors"
                aria-label="제목 복사"
              >
                <Icon
                  name={titleCopied ? 'check-bg' : 'copy'}
                  size={24}
                  color="currentColor"
                />
              </button>
            </div>
          </div>

          {/* 편집 가능한 교정본 영역 */}
          <div className="flex-1 bg-background-surface flex flex-col gap-3.5 p-6 rounded-md min-h-0 overflow-hidden">
            <textarea
              className="flex-1 resize-none bg-transparent text-lg font-semibold leading-9 tracking-tight text-text-secondary outline-none overflow-y-auto px-2.5 pb-5.5 w-full min-h-0"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              aria-label="교정된 이메일 본문 (수정 가능)"
            />
            <div className="flex gap-1 items-center justify-end shrink-0 py-1">
              <span
                className={`text-sm leading-5.5 tracking-tight ${emailText.length > 2000 ? 'text-text-danger' : 'text-text-primary'}`}
              >
                {emailText.length.toLocaleString()}
              </span>
              <span
                className={`text-sm leading-5.5 tracking-tight ${emailText.length > 2000 ? 'text-text-danger' : 'text-text-disabled'}`}
              >
                /
              </span>
              <span
                className={`text-sm leading-5.5 tracking-tight ${emailText.length > 2000 ? 'text-text-danger' : 'text-text-tertiary'}`}
              >
                2,000
              </span>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="w-px bg-black-alpha-16 rounded-full shrink-0" />

        {/* ── 우측: 교정 요약 카드 ── */}
        <div className="w-127.5 shrink-0 bg-background-surface rounded-2xl flex flex-col overflow-hidden justify-between max-lg:w-full">
          <div className="p-6">
            {/* 헤더 */}
            <div className="shrink-0 border-b border-border-default pb-3.5">
              <h2 className="p-2.5 text-base font-semibold leading-6 tracking-tight text-text-primary">
                교정 요약
              </h2>
              <span className="p-2.5 text-3xl-plus font-bold leading-10 tracking-tight text-text-secondary">
                총 {totalChanges}건 완료
              </span>
            </div>
            {/* 필수/추천/참고 분류 */}
            <div className="flex flex-col gap-1.5 py-3.5 border-b border-border-default">
              {autoCount > 0 && (
                <div className={`${labelBox}`}>
                  <span className={`required ${labelBase}`}>필수 교정</span>
                  <span>{autoCount}건</span>
                </div>
              )}
              {suggestCount > 0 && (
                <div className={`${labelBox}`}>
                  <span className={`recommend ${labelBase}`}>추천 교정</span>
                  <span>{suggestCount}건</span>
                </div>
              )}
              {styleCount > 0 && (
                <div className={`${labelBox}`}>
                  <span className={`reference ${labelBase}`}>참고</span>
                  <span>{styleCount}건</span>
                </div>
              )}
            </div>

            {/* 교정 항목 목록 */}
            <div className="flex-1 overflow-y-auto pt-3.5 flex flex-col gap-3.5 lg:max-h-100">
              {changes.map((change) => (
                <div
                  key={change.index}
                  className="flex items-center gap-3 p-2.5"
                >
                  {/* 원문 → 교정 텍스트 */}
                  <div className="flex-1 flex items-center gap-2.5 min-w-0 overflow-hidden">
                    <span className="line-through text-sm text-text-tertiary leading-5 tracking-tight shrink-0 max-w-30 truncate">
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
                    <span className="text-lg font-medium text-text-primary leading-5 tracking-tight truncate">
                      {change.corrected}
                    </span>
                  </div>

                  {/* 액션 상태 뱃지 */}
                  <div
                    className={`shrink-0 flex items-center justify-center px-2 py-0.5 rounded text-base font-semibold leading-4 tracking-tight text-gray-500`}
                  >
                    {getActionLabel(change.action)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 확정본 복사하기 버튼 */}
          <div className="px-6 pb-6 pt-2 shrink-0 text-2xl w-full max-lg:w-[calc(100%-90px)] bottom-0 left-[90px] right-0 max-lg:fixed max-lg:py-10 w-">
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
                <Icon
                  name="check"
                  size={24}
                  viewBox="0 0 16 16"
                  color="currentColor"
                />
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

// 복사 실패 테스트
// 콘솔에 붙여넣기
// navigator.clipboard.writeText = () => Promise.reject(new Error('denied'));
