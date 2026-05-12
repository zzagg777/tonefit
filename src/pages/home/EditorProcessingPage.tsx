import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useKeyDown } from '@/hooks/useKeyDown';
import { MOCK_ORIGINAL } from '@/mocks/handlers';
import { Icon } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useRequestCorrection } from '@/queries';
import type { ReceiverType, PurposeType } from '@/types';
import TitleText from '@/components/ui/TitleText';
import Button from '@/components/ui/Button';
import emojiSad from '@/assets/emoji-sad.svg';
import { devLog, devWarn } from '@/utils/devLog';

// true: 디자인 확인용 — API 호출 및 페이지 이동 없이 로딩 화면 유지
const FREEZE_FOR_DESIGN = false;

// DEV 전용 — null이면 실제 타이머 동작 / 1·2·3·'timeout' 설정 시 해당 단계 즉시 표시
const DEV_PHASE_OVERRIDE: LoadingPhase | null = null;

// =============================================================
// 로딩 단계 (Phase) 설정
// =============================================================

type LoadingPhase = 1 | 2 | 3 | 'timeout';

const PHASE_THRESHOLDS = {
  phase2: 15_000, // 15초 → 단계 2
  phase3: 30_000, // 30초 → 단계 3
  timeout: 60_000, // 60초 → 타임아웃
};

const PHASE_CONFIG: Record<1 | 2 | 3, { heading: string; subtitle: string }> = {
  1: {
    heading: '이메일을 꼼꼼히 검토하고 있어요',
    subtitle: '수신자와 목적에 맞게 AI가 분석하고 있어요',
  },
  2: {
    heading: '조금 더 살펴보고 있어요',
    subtitle: 'AI가 더 꼼꼼하게 검토하고 있어요, 거의 다 됐어요 :)',
  },
  3: {
    heading: '조금 더 시간이 필요해요',
    subtitle: '이메일 내용이 많을수록 AI가 더 신중하게 검토해요',
  },
};

// =============================================================
// StepItem 서브 컴포넌트
// =============================================================

type ProcessingStep = 'pending' | 'active' | 'done';

interface StepItemProps {
  status: ProcessingStep;
  label: string;
}

const StepItem = ({ status, label }: StepItemProps) => {
  const iconEl = () => {
    if (status === 'done') {
      return (
        <Icon
          name="check-circle-bg"
          size={32}
          color="var(--color-icon-success)"
        />
      );
    }
    if (status === 'active') {
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          className="animate-spin"
          style={{ animationDuration: '1s' }}
        >
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="var(--color-border-default)"
            strokeWidth="3"
          />
          <path
            d="M16 3 A13 13 0 0 1 29 16"
            stroke="var(--color-icon-load)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    }
    // pending
    return (
      <Icon
        name="pending"
        size={32}
        viewBox="0 0 32 32"
        color="var(--color-icon-tertiary)"
      />
    );
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="shrink-0 size-8 flex items-center justify-center">
        {iconEl()}
      </div>
      <div className="flex items-center justify-center p-2.5">
        <span
          className={`text-xl font-semibold leading-7 tracking-tight whitespace-nowrap ${
            status === 'active'
              ? 'text-text-info'
              : status === 'done'
                ? 'text-text-primary'
                : 'text-text-tertiary'
          }`}
        >
          {status === 'pending' && label + ' 준비하고 있어요'}
          {status === 'active' && label + ' 진행하고 있어요...'}
          {status === 'done' && label + ' 완료했어요'}
        </span>
      </div>
    </div>
  );
};

// =============================================================
// 메인 컴포넌트
// =============================================================

interface LocationState {
  receiverType: ReceiverType;
  purposeType: PurposeType;
  originalEmail: string;
}

const MOCK_STATE: LocationState = {
  receiverType: 'DIRECT_SUPERVISOR',
  purposeType: 'REPORT',
  originalEmail: MOCK_ORIGINAL,
};

const EditorProcessingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rawState = location.state as LocationState | null;
  // 직접 URL 접속 등 state 없는 경우 에디터로 복귀 (MOCK_STATE 폴백 제거)
  const state = rawState ?? (FREEZE_FOR_DESIGN ? MOCK_STATE : null);

  const [step1, setStep1] = useState<ProcessingStep>('pending');
  const [step2, setStep2] = useState<ProcessingStep>('pending');
  const [step3, setStep3] = useState<ProcessingStep>('pending');

  // 로딩 메시지 단계 (DEV_PHASE_OVERRIDE 설정 시 해당 단계 고정)
  const [phase, setPhase] = useState<LoadingPhase>(DEV_PHASE_OVERRIDE ?? 1);

  const { mutateAsync: requestCorrectionAsync } = useRequestCorrection();
  const cancelledRef = useRef(false);
  // StrictMode 이중 실행 방지: API 호출 자체를 한 번만 허용
  const calledRef = useRef(false);
  // 재시도 시 이전 요청의 stale 콜백 무시
  const requestIdRef = useRef(0);
  // 단계 전환 타이머 목록 (재시도 시 초기화용)
  const phaseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // DEV: 경과 시간 interval
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  // ----------------------------------------------------------
  // 단계 전환 타이머 시작 헬퍼
  // ----------------------------------------------------------
  const startPhaseTimers = useCallback(() => {
    // 기존 타이머 정리
    phaseTimersRef.current.forEach(clearTimeout);

    if (DEV_PHASE_OVERRIDE !== null) return; // DEV 고정 모드에서는 타이머 불필요

    const t1 = setTimeout(
      () => setPhase((p) => (p === 1 ? 2 : p)),
      PHASE_THRESHOLDS.phase2
    );
    const t2 = setTimeout(
      () => setPhase((p) => (p !== 'timeout' ? 3 : p)),
      PHASE_THRESHOLDS.phase3
    );
    const t3 = setTimeout(() => setPhase('timeout'), PHASE_THRESHOLDS.timeout);

    phaseTimersRef.current = [t1, t2, t3];
  }, []);

  // ----------------------------------------------------------
  // API 요청 헬퍼 (초기 호출 & 재시도 공용)
  // ----------------------------------------------------------
  const doRequest = useCallback(async () => {
    if (!state) {
      devWarn('[doRequest] state 없음 — 요청 중단');
      return;
    }

    const myId = ++requestIdRef.current;
    devLog(`[doRequest] 요청 시작 myId=${myId}`);

    try {
      const data = await requestCorrectionAsync({
        receiver_type: state.receiverType,
        purpose: state.purposeType,
        original_email: state.originalEmail,
      });

      devLog(
        `[onSuccess] myId=${myId} cancelled=${cancelledRef.current} currentId=${requestIdRef.current}`,
        data
      );
      if (cancelledRef.current) {
        devWarn('[onSuccess] cancelled — navigate 차단');
        return;
      }
      if (requestIdRef.current !== myId) {
        devWarn(
          `[onSuccess] stale — myId=${myId} currentId=${requestIdRef.current}`
        );
        return;
      }

      setStep2('done');
      setStep3('active');
      await new Promise<void>((r) => setTimeout(r, 800));
      if (cancelledRef.current) return;
      setStep3('done');
      await new Promise<void>((r) => setTimeout(r, 500));
      if (cancelledRef.current) return;

      devLog('[onSuccess] navigate →', ROUTES.EDITOR_RESULT);
      navigate(ROUTES.EDITOR_RESULT, {
        state: {
          correctionData: data,
          originalEmail: state.originalEmail,
          receiverType: state.receiverType,
          purposeType: state.purposeType,
        },
      });
    } catch (err) {
      devWarn(`[onError] myId=${myId} cancelled=${cancelledRef.current}`, err);
      if (cancelledRef.current) return;
      if (requestIdRef.current !== myId) return;
      navigate(ROUTES.EDITOR, {
        state: {
          receiver: state.receiverType,
          purpose: state.purposeType,
          emailText: state.originalEmail,
          error: '교정 중 오류가 발생했습니다. 다시 시도해 주세요.',
        },
        replace: true,
      });
    }
  }, [state, requestCorrectionAsync, navigate]);

  // ----------------------------------------------------------
  // 초기 마운트 effect
  // ----------------------------------------------------------
  useEffect(() => {
    // cleanup 후 재실행 시 네비게이션 가드 리셋 (콜백이 navigate를 막지 않도록)
    cancelledRef.current = false;

    // 필수 state 없으면 에디터로 복귀
    if (!state?.originalEmail) {
      navigate(ROUTES.EDITOR, { replace: true });
      return;
    }

    // Step 1: 원문 확인 (즉시)
    const t1 = setTimeout(() => setStep1('done'), 600);
    // Step 2: 높임법/맞춤법 검토 (활성화)
    const t2 = setTimeout(() => setStep2('active'), 700);

    if (FREEZE_FOR_DESIGN)
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };

    // 단계 전환 타이머 + 경과 시간 로그는 항상 재시작
    // — StrictMode에서 cleanup이 타이머를 지우므로, 재실행 시에도 복구해야 함
    startPhaseTimers();

    // DEV: 로딩 페이지 진입 후 경과 시간 실시간 출력 (1초 간격)
    if (startedAtRef.current === 0) startedAtRef.current = Date.now(); // 최초 1회만 기록
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = setInterval(() => {
      const sec = ((Date.now() - startedAtRef.current) / 1000).toFixed(1);
      devLog(`[LOADING] ${sec}s 경과`);
    }, 1000);

    // StrictMode에서 effect가 두 번 실행되어도 API는 한 번만 호출
    if (calledRef.current)
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    calledRef.current = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void doRequest(); // async 함수 — setState는 await 이후 비동기 컨텍스트에서만 호출됨

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      phaseTimersRef.current.forEach(clearTimeout);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      // cancelledRef는 여기서 true로 설정하지 않음
      // — cleanup 후 effect가 재실행될 때 상단에서 false로 리셋하며,
      //   cleanup과 재실행 사이에 API 응답이 오면 navigate가 막히는 버그 방지
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------------------------------------
  // 이벤트 핸들러
  // ----------------------------------------------------------

  /** 교정 취소: 에디터로 복귀 (입력 데이터 유지) */
  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    phaseTimersRef.current.forEach(clearTimeout);
    navigate(ROUTES.EDITOR, {
      state: state
        ? {
            receiver: state.receiverType,
            purpose: state.purposeType,
            emailText: state.originalEmail,
          }
        : null,
      replace: true,
    });
  }, [state, navigate]);

  /** 다시 시도: 동일 입력값으로 교정 API 재호출 */
  const handleRetry = useCallback(() => {
    cancelledRef.current = false;
    setPhase(DEV_PHASE_OVERRIDE ?? 1);
    setStep1('pending');
    setStep2('pending');
    setStep3('pending');
    // 스텝 애니메이션 재시작
    setTimeout(() => setStep1('done'), 600);
    setTimeout(() => setStep2('active'), 700);
    startPhaseTimers();
    void doRequest(); // async 함수 — 에러/navigate 처리가 내부에서 완결되므로 Promise 무시
  }, [startPhaseTimers, doRequest]);

  useKeyDown('Escape', handleCancel);

  // state 없으면 렌더링 차단 — 직접 URL 접속 방어
  if (!state) return <Navigate to={ROUTES.EDITOR} replace />;

  // ----------------------------------------------------------
  // 렌더링
  // ----------------------------------------------------------

  // 60초 타임아웃 UI
  if (phase === 'timeout') {
    return (
      <main
        id="process"
        className="flex-1 bg-background-page flex flex-col items-center justify-center gap-18 px-10 py-10"
      >
        <h1 className="sr-only">이메일 교정 처리 중</h1>

        {/* 슬픈 이모지 */}
        <img src={emojiSad} alt="" aria-hidden="true" className="w-40 h-40" />

        {/* 안내 텍스트 */}
        <TitleText
          heading="교정을 완료하지 못했어요"
          subtitle="잠시 후 다시 시도해 주세요. 입력하신 내용은 그대로 유지돼요."
          align="center"
        />

        {/* 다시 시도 버튼 */}
        <div className="w-full max-w-131">
          <Button onClick={handleRetry}>다시 시도하기</Button>
        </div>

        {/* 교정 취소 */}
        <button
          onClick={handleCancel}
          className="border-b border-text-tertiary pb-1 text-lg font-semibold leading-6.5 tracking-tight text-text-tertiary hover:text-text-secondary transition-colors"
        >
          교정 취소
        </button>
      </main>
    );
  }

  // 로딩 중 UI
  const currentPhaseConfig = PHASE_CONFIG[phase];

  return (
    <main
      id="process"
      className="flex-1 bg-background-page flex flex-col items-center justify-center gap-18 px-10 py-10"
    >
      <h1 className="sr-only">이메일 교정 처리 중</h1>
      {/* 로딩 원형 애니메이션 */}
      <div className="relative size-40 flex items-center justify-center w-40 h-40">
        {/* 배경 원 */}
        <svg
          className="absolute inset-0"
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
        >
          <circle
            cx="80"
            cy="80"
            r="72"
            stroke="var(--color-border-default)"
            strokeWidth="8"
          />
        </svg>
        {/* 회전하는 호 */}
        <svg
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: '1.4s' }}
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
        >
          <circle
            cx="80"
            cy="80"
            r="72"
            stroke="var(--color-icon-load)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="340 113"
            strokeDashoffset="113"
          />
        </svg>
        {/* 가운데 연필 아이콘 */}
        <div className="flex flex-col items-center gap-2 z-10">
          <Icon name="pencil-ai" size={48} color="var(--color-icon-load)" />
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-2 rounded-full bg-background-load animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 타이틀 텍스트 — 단계별 변경 */}
      <TitleText
        heading={currentPhaseConfig.heading}
        subtitle={currentPhaseConfig.subtitle}
        align="center"
      />

      {/* 진행 단계 */}
      <div className="flex flex-col gap-6">
        <StepItem status={step1} label="원문 내용 확인을" />
        <StepItem status={step2} label="높임법과 맞춤법 검토를" />
        <StepItem status={step3} label="교정 결과 정리를 위해" />
      </div>

      {/* 취소 버튼 */}
      <button
        onClick={handleCancel}
        className="border-b border-text-tertiary pb-1 text-lg font-semibold leading-6.5 tracking-tight text-text-tertiary hover:text-text-secondary transition-colors"
      >
        교정 취소
      </button>
    </main>
  );
};

export default EditorProcessingPage;
