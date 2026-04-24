import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SidebarNav from '@/components/layout/SidebarNav';
import { Icon } from '@/components/ui';
import { ROUTES } from '@/constants';
import { useRequestCorrection } from '@/queries';
import type { ReceiverType, PurposeType } from '@/types';

type ProcessingStep = 'pending' | 'active' | 'done';

interface StepItemProps {
  status: ProcessingStep;
  label: string;
}

const StepItem = ({ status, label }: StepItemProps) => {
  const iconEl = () => {
    if (status === 'done') {
      return (
        <Icon name="check-circle-bg" size={32} className="text-text-success" />
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
            stroke="var(--color-text-brand)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    }
    // pending
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <circle
            key={i}
            cx={16 + 10 * Math.cos((deg * Math.PI) / 180)}
            cy={16 + 10 * Math.sin((deg * Math.PI) / 180)}
            r="2"
            fill="#D1D5DB"
          />
        ))}
      </svg>
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
              ? 'text-text-brand'
              : status === 'done'
                ? 'text-text-primary'
                : 'text-text-tertiary'
          }`}
        >
          {label}
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
  originalEmail:
    '팀장님 안녕하세요. 마케팅팀 김준형입니다. 이번 신규 캠페인 기획안 관련하여 보고드립니다.',
};

const EditorProcessingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? MOCK_STATE;

  const [step1, setStep1] = useState<ProcessingStep>('pending');
  const [step2, setStep2] = useState<ProcessingStep>('pending');
  const [step3, setStep3] = useState<ProcessingStep>('pending');

  const { mutate: requestCorrection, isPending } = useRequestCorrection();

  useEffect(() => {
    // Step 1: 원문 확인 (즉시)
    const t1 = setTimeout(() => setStep1('done'), 600);
    // Step 2: 높임법/맞춤법 검토 (활성화)
    const t2 = setTimeout(() => setStep2('active'), 700);

    // 교정 API 호출
    requestCorrection(
      {
        receiver_type: state.receiverType,
        purpose: state.purposeType,
        original_email: state.originalEmail,
      },
      {
        onSuccess: (data) => {
          setStep2('done');
          setStep3('active');
          setTimeout(() => {
            setStep3('done');
            setTimeout(() => {
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
          navigate(ROUTES.EDITOR, {
            state: {
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
    navigate(ROUTES.EDITOR);
  };

  return (
    <div className="flex h-screen bg-background-muted overflow-hidden">
      <SidebarNav />

      <div className="flex-1 bg-background-page flex flex-col items-center justify-center gap-[72px] px-10 py-20">
        {/* 로딩 원형 애니메이션 */}
        <div className="relative size-[160px] flex items-center justify-center">
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
              stroke="var(--color-text-brand)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="340 113"
              strokeDashoffset="113"
            />
          </svg>
          {/* 가운데 연필 아이콘 */}
          <div className="flex flex-col items-center gap-2 z-10">
            <Icon name="pencil-ai" size={48} color="var(--color-text-brand)" />
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-2 rounded-full bg-text-brand animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 타이틀 텍스트 */}
        <div className="flex flex-col gap-2.5 items-center text-center text-text-primary w-[524px]">
          <h1 className="text-4xl font-bold leading-11 tracking-tight">
            이메일을 꼼꼼히 다듬고 있어요
          </h1>
          <p className="text-base font-normal leading-6 tracking-tight">
            잠시만요, 곧 완성됩니다.
          </p>
        </div>

        {/* 진행 단계 */}
        <div className="flex flex-col gap-6 w-[348px]">
          <StepItem status={step1} label="원문 내용을 확인했어요." />
          <StepItem
            status={step2}
            label="높임법과 맞춤법 검토를 진행하고 있어요"
          />
          <StepItem
            status={step3}
            label="교정 결과 정리를 위해 준비하고 있어요"
          />
        </div>

        {/* 취소 버튼 */}
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="border-b border-text-tertiary pb-1 text-lg font-semibold leading-[26px] tracking-tight text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </div>
  );
};

export default EditorProcessingPage;
