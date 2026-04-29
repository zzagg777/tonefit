import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useConfirmCorrection } from '@/queries';
import type {
  ReceiverType,
  PurposeType,
  CorrectionChange,
  FeedbackActionType,
  CorrectionResponse,
} from '@/types';

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

  const { mutate: confirmCorrection } = useConfirmCorrection();
  const cancelledRef = useRef(false);

  useEffect(() => {
    // StrictMode 대응: effect 재실행 시 ref 리셋
    cancelledRef.current = false;

    // 필수 state 없으면 에디터로 복귀
    if (!state?.sessionId) {
      navigate(ROUTES.EDITOR, { replace: true });
      return;
    }

    confirmCorrection(
      {
        sessionId: state.sessionId,
        data: { final_email: state.finalEmail },
      },
      {
        onSuccess: () => {
          if (cancelledRef.current) return;
          setTimeout(() => {
            if (cancelledRef.current) return;
            navigate(ROUTES.EDITOR_DONE, {
              state: {
                sessionId: state.sessionId,
                finalEmail: state.finalEmail,
                receiverType: state.receiverType,
                purposeType: state.purposeType,
                changes: state.changes,
              },
              replace: true,
            });
          }, 400);
        },
        onError: () => {
          if (cancelledRef.current) return;
          // 확정 실패 시 교정 결과 화면으로 복귀
          navigate(ROUTES.EDITOR_RESULT, {
            state: {
              correctionData: state.correctionData,
              originalEmail: state.originalEmail,
              receiverType: state.receiverType,
              purposeType: state.purposeType,
            },
            replace: true,
          });
        },
      }
    );

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  return (
    <main
      id="confirm-loading"
      className="flex-1 bg-background-page flex flex-col items-center justify-center gap-18 px-10 py-10"
    >
      {/* 로딩 원형 애니메이션 */}
      <div className="relative size-40 flex items-center justify-center">
        {/* 배경 원 */}
        <svg
          className="absolute inset-0"
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
        >
          <circle cx="80" cy="80" r="72" stroke="#E5E7EB" strokeWidth="8" />
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
        {/* 가운데 체크 아이콘 */}
        <div className="z-10">
          <Icon
            name="check-circle-bg"
            size={48}
            color="var(--color-icon-success)"
          />
        </div>
      </div>

      {/* 타이틀 텍스트 */}
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl-plus font-bold leading-9 tracking-tight text-text-primary text-center">
          교정안을 최종 확정하고 있어요
        </h2>
        <p className="text-xl font-medium leading-7 tracking-tight text-text-tertiary text-center">
          잠시만요, 곧 완성됩니다.
        </p>
      </div>
    </main>
  );
};

export default EditorConfirmLoadingPage;
