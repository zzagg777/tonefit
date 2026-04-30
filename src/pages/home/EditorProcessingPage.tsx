import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKeyDown } from '@/hooks/useKeyDown';
import { MOCK_ORIGINAL } from '@/mocks/handlers';
import { Icon } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useRequestCorrection } from '@/queries';
import type { ReceiverType, PurposeType } from '@/types';
import TitleText from '@/components/ui/TitleText';

// true: 디자인 확인용 — API 호출 및 페이지 이동 없이 로딩 화면 유지
const FREEZE_FOR_DESIGN = true;

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
          <circle cx="16" cy="16" r="13" stroke="#E5E7EB" strokeWidth="3" />
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
  const state = (location.state as LocationState | null) ?? MOCK_STATE;

  const [step1, setStep1] = useState<ProcessingStep>('pending');
  const [step2, setStep2] = useState<ProcessingStep>('pending');
  const [step3, setStep3] = useState<ProcessingStep>('pending');

  const { mutate: requestCorrection } = useRequestCorrection();
  const cancelledRef = useRef(false);

  useEffect(() => {
    // StrictMode 대응: effect 재실행 시 ref 리셋
    cancelledRef.current = false;

    // Step 1: 원문 확인 (즉시)
    const t1 = setTimeout(() => setStep1('done'), 600);
    // Step 2: 높임법/맞춤법 검토 (활성화)
    const t2 = setTimeout(() => setStep2('active'), 700);

    if (FREEZE_FOR_DESIGN)
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };

    // 교정 API 호출
    requestCorrection(
      {
        receiver_type: state.receiverType,
        purpose: state.purposeType,
        original_email: state.originalEmail,
      },
      {
        onSuccess: (data) => {
          if (cancelledRef.current) return;
          setStep2('done');
          setStep3('active');
          setTimeout(() => {
            if (cancelledRef.current) return;
            setStep3('done');
            setTimeout(() => {
              if (cancelledRef.current) return;
              navigate(ROUTES.EDITOR_RESULT, {
                state: {
                  correctionData: data,
                  originalEmail: state.originalEmail,
                  receiverType: state.receiverType,
                  purposeType: state.purposeType,
                },
              });
            }, 500);
          }, 800);
        },
        onError: () => {
          if (cancelledRef.current) return;
          navigate(ROUTES.EDITOR, {
            state: {
              receiver: state.receiverType,
              purpose: state.purposeType,
              emailText: state.originalEmail,
              error: '교정 중 오류가 발생했습니다. 다시 시도해 주세요.',
            },
            replace: true,
          });
        },
      }
    );

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleCancel = () => {
    cancelledRef.current = true;
    navigate(ROUTES.EDITOR, {
      state: {
        receiver: state.receiverType,
        purpose: state.purposeType,
        emailText: state.originalEmail,
      },
      replace: true,
    });
  };
  useKeyDown('Escape', handleCancel);

  return (
    <main
      id="process"
      className="flex-1 bg-background-page flex flex-col items-center justify-center gap-18 px-10 py-10"
    >
      {/* 로딩 원형 애니메이션 */}
      <div className="relative size-40 flex items-center justify-center w-[160px] h-[160px]">
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
        heading="이메일을 꼼꼼히 다듬고 있어요"
        subtitle="잠시만요, 곧 완성됩니다."
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
        취소
      </button>
    </main>
  );
};

export default EditorProcessingPage;
