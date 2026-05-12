import { useEffect, useRef } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Icon, TitleText } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useFinalizeCorrection, useConfirmCorrection } from '@/queries';
import type { AxiosError } from 'axios';
import type {
  ReceiverType,
  PurposeType,
  CorrectionChange,
  FeedbackActionType,
  CorrectionResponse,
  FinalizeResponse,
} from '@/types';

// true: 디자인 확인용 — API 호출 및 페이지 이동 없이 로딩 화면 유지
const FREEZE_FOR_DESIGN = false;

interface LocationState {
  sessionId: number;
  finalEmail: string;
  receiverType: ReceiverType;
  purposeType: PurposeType;
  changes: (CorrectionChange & { action: FeedbackActionType | null })[];
  originalEmail: string;
  correctionData: CorrectionResponse;
}

const EditorConfirmLoadingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const { mutateAsync: finalizeAsync } = useFinalizeCorrection();
  const { mutateAsync: confirmAsync } = useConfirmCorrection();
  const cancelledRef = useRef(false);
  // StrictMode 이중 실행 방지: API 호출 자체를 한 번만 허용
  const calledRef = useRef(false);

  useEffect(() => {
    // cleanup 후 재실행 시 네비게이션 가드 리셋
    cancelledRef.current = false;

    // 필수 state 없으면 에디터로 복귀
    if (!state?.sessionId) {
      navigate(ROUTES.EDITOR, { replace: true });
      return;
    }

    if (FREEZE_FOR_DESIGN) return;

    // StrictMode에서 effect가 두 번 실행되어도 API는 한 번만 호출
    if (calledRef.current) return;
    calledRef.current = true;

    const run = async () => {
      // Step 1: finalize → EDITING 상태로 전환 (ai_final, ai_subject 반환)
      // 400이면 이미 EDITING 상태(뒤로가기 후 재시도 등) → finalize 건너뛰고 confirm으로 진행
      let finalizeData: FinalizeResponse | undefined;
      try {
        finalizeData = await finalizeAsync(state.sessionId);
      } catch (error) {
        const status = (error as AxiosError)?.response?.status;
        if (status !== 400) {
          // finalize 실패 (400 제외) → 결과 페이지로 복귀
          if (cancelledRef.current) return;
          navigate(ROUTES.EDITOR_RESULT, {
            state: {
              correctionData: state.correctionData,
              originalEmail: state.originalEmail,
              receiverType: state.receiverType,
              purposeType: state.purposeType,
            },
            replace: true,
          });
          return;
        }
        // 400: 이미 EDITING 상태 → finalizeData 없이 confirm 진행
      }

      if (cancelledRef.current) return;

      // Step 2: confirm → CONFIRMED 상태로 전환
      try {
        await confirmAsync({
          sessionId: state.sessionId,
          data: { user_final: state.finalEmail },
        });
      } catch {
        // confirm 실패 → 결과 페이지로 복귀
        if (cancelledRef.current) return;
        navigate(ROUTES.EDITOR_RESULT, {
          state: {
            correctionData: state.correctionData,
            originalEmail: state.originalEmail,
            receiverType: state.receiverType,
            purposeType: state.purposeType,
          },
          replace: true,
        });
        return;
      }

      if (cancelledRef.current) return;

      await new Promise<void>((r) => setTimeout(r, 400));
      if (cancelledRef.current) return;

      navigate(ROUTES.EDITOR_DONE, {
        state: {
          sessionId: state.sessionId,
          finalEmail: state.finalEmail,
          aiFinal: finalizeData?.ai_final,
          aiSubject: finalizeData?.ai_subject,
          receiverType: state.receiverType,
          purposeType: state.purposeType,
          changes: state.changes,
        },
        replace: true,
      });
    };

    run();

    return () => {
      // cancelledRef는 여기서 true로 설정하지 않음
      // — mutateAsync는 Promise 기반으로 컴포넌트 마운트 상태와 무관하게 동작하며,
      //   cleanup과 재실행 사이에 응답이 와도 navigate가 막히지 않도록 유지
    };
  }, []);

  // state 없으면 렌더링 차단 — 직접 URL 접속 방어
  if (!state?.sessionId) return <Navigate to={ROUTES.EDITOR} replace />;

  return (
    <main
      id="confirm-loading"
      className="flex-1 bg-background-page flex flex-col items-center justify-center gap-18 px-10 py-10"
    >
      <h1 className="sr-only">교정안 최종 확정 중</h1>
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

      {/* 타이틀 텍스트 */}
      <TitleText
        heading="교정안을 최종 확정하고 있어요"
        subtitle="잠시만요, 곧 완성됩니다."
        align="center"
      />
    </main>
  );
};

export default EditorConfirmLoadingPage;
