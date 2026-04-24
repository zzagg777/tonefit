import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TitleText from '@/components/ui/TitleText';
import SidebarNav from '@/components/layout/SidebarNav';
import { Icon } from '@/components/ui';
import {
  ROUTES,
  RECEIVER_TYPE_LABELS,
  PURPOSE_LABELS,
  INPUT_LIMITS,
  VALIDATION_MESSAGES,
} from '@/constants';
import type { ReceiverType, PurposeType } from '@/types';

const RECEIVER_OPTIONS: ReceiverType[] = [
  'DIRECT_SUPERVISOR',
  'OTHER_DEPT_COLLEAGUE',
  'CLIENT',
  'EXTERNAL_PARTNER',
];

const PURPOSE_OPTIONS: PurposeType[] = [
  'REPORT',
  'REQUEST',
  'NOTICE',
  'THANKS',
  'APOLOGY',
  'COOPERATION',
  'DECLINE',
];

interface StepLabelProps {
  step: number;
  title: string;
}

const StepLabel = ({ step, title }: StepLabelProps) => (
  <div className="flex gap-0.5 items-center">
    <div className="w-[30px] h-[30px] rounded-full bg-background-inverse flex items-center justify-center shrink-0">
      <span className="text-xl font-semibold leading-7 tracking-tight text-text-inverse text-center">
        {step}
      </span>
    </div>
    <div className="flex items-center justify-center p-2.5">
      <span className="text-2xl font-bold leading-8 tracking-tight text-black whitespace-nowrap">
        {title}
      </span>
    </div>
  </div>
);

const EditorPage = () => {
  const navigate = useNavigate();

  const [receiver, setReceiver] = useState<ReceiverType | null>(null);
  const [purpose, setPurpose] = useState<PurposeType | null>(null);
  const [emailText, setEmailText] = useState('');
  const [errors, setErrors] = useState<{
    receiver?: string;
    purpose?: string;
    email?: string;
  }>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = emailText.length;
  const isOverLimit = charCount > INPUT_LIMITS.EMAIL_MAX_LENGTH;
  const canSubmit =
    receiver &&
    purpose &&
    charCount >= INPUT_LIMITS.EMAIL_MIN_LENGTH &&
    !isOverLimit;

  useEffect(() => {
    const timer = setTimeout(() => {
      // draft 자동 저장 (API 연동 후 구현)
    }, 1000);
    return () => clearTimeout(timer);
  }, [receiver, purpose, emailText]);

  const handleSubmit = () => {
    const newErrors: typeof errors = {};
    if (!receiver) newErrors.receiver = VALIDATION_MESSAGES.RECEIVER_REQUIRED;
    if (!purpose) newErrors.purpose = VALIDATION_MESSAGES.PURPOSE_REQUIRED;
    if (!emailText) newErrors.email = VALIDATION_MESSAGES.EMAIL_REQUIRED;
    else if (charCount < INPUT_LIMITS.EMAIL_MIN_LENGTH)
      newErrors.email = VALIDATION_MESSAGES.EMAIL_TOO_SHORT;
    else if (isOverLimit)
      newErrors.email = VALIDATION_MESSAGES.EMAIL_TOO_LONG(charCount);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    navigate(ROUTES.EDITOR_PROCESSING, {
      state: {
        receiverType: receiver,
        purposeType: purpose,
        originalEmail: emailText,
      },
    });
  };

  const chipBase =
    'h-[46px] flex items-center justify-center px-6 rounded-2xl text-lg font-semibold leading-[26px] tracking-tight transition-colors cursor-pointer';
  const chipSelected = 'bg-background-inverse text-text-inverse';
  const chipDefault =
    'bg-background-subtle text-text-placeholder hover:bg-background-hover-2 hover:text-text-inverse';

  return (
    <div className="flex h-screen bg-background-muted overflow-hidden">
      <SidebarNav />

      <div className="flex-1 bg-background-page flex flex-col items-center py-20 overflow-y-auto">
        {/* 콘텐츠 영역 */}
        <div className="flex flex-col gap-11 items-start w-full px-10 flex-1">
          {/* 타이틀 */}
          <TitleText
            heading="이메일 교정"
            subtitle="작성하신 이메일을 대상과 상황에 맞춰 완벽하게 다듬어 드립니다."
            align="left"
          />

          {/* 메인 레이아웃: 좌측(수신자/목적) + 우측(이메일 입력) */}
          <div className="flex gap-20 items-start w-full flex-1 min-h-0">
            {/* 좌측: 수신자 + 목적 선택 */}
            <div className="flex-1 flex flex-col gap-[14px] min-w-0">
              {/* 수신자 유형 */}
              <div className="flex flex-col gap-4 w-full">
                <StepLabel step={1} title="수신자 유형 선택" />
                <div className="flex flex-col gap-2 w-full">
                  <div className="grid grid-cols-4 gap-3 w-full">
                    {RECEIVER_OPTIONS.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setReceiver(type);
                          setErrors((e) => ({ ...e, receiver: undefined }));
                        }}
                        className={`${chipBase} ${receiver === type ? chipSelected : chipDefault}`}
                      >
                        {RECEIVER_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                  {errors.receiver && (
                    <p className="text-sm text-text-danger leading-[22px] tracking-tight px-2.5">
                      {errors.receiver}
                    </p>
                  )}
                </div>
              </div>

              {/* 목적 선택 */}
              <div className="flex flex-col gap-4 w-full">
                <StepLabel step={2} title="목적 선택" />
                <div className="flex flex-col gap-2 w-full">
                  <div className="grid grid-cols-4 gap-3.5 w-full">
                    {PURPOSE_OPTIONS.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setPurpose(type);
                          setErrors((e) => ({ ...e, purpose: undefined }));
                        }}
                        className={`${chipBase} ${purpose === type ? chipSelected : chipDefault}`}
                      >
                        {PURPOSE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                  {errors.purpose && (
                    <p className="text-sm text-text-danger leading-[22px] tracking-tight px-2.5">
                      {errors.purpose}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 우측: 이메일 원문 입력 */}
            <div className="flex-1 flex flex-col gap-4 h-full min-w-0">
              <StepLabel step={3} title="이메일 원문 입력" />

              <div className="flex-1 flex flex-col gap-2.5 min-h-0">
                {/* 텍스트 영역 */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 bg-background-subtle rounded-lg px-6 py-5 relative min-h-[400px]">
                    <textarea
                      ref={textareaRef}
                      value={emailText}
                      onChange={(e) => {
                        setEmailText(e.target.value);
                        setErrors((err) => ({ ...err, email: undefined }));
                      }}
                      placeholder="교정할 이메일 원문을 붙여넣어 주세요."
                      className="w-full h-full resize-none bg-transparent text-lg font-semibold leading-[26px] tracking-tight text-text-secondary placeholder:text-text-placeholder outline-none"
                    />
                  </div>
                </div>

                {/* 에러 + 글자 수 */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {errors.email && (
                      <p className="text-sm text-text-danger leading-[22px] tracking-tight px-2.5">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 items-center">
                    <span
                      className={`text-sm leading-[22px] tracking-tight ${isOverLimit ? 'text-text-danger' : 'text-text-primary'}`}
                    >
                      {charCount.toLocaleString()}
                    </span>
                    <span className="text-sm leading-[22px] tracking-tight text-text-disabled">
                      /
                    </span>
                    <span className="text-sm leading-[22px] tracking-tight text-text-tertiary">
                      {INPUT_LIMITS.EMAIL_MAX_LENGTH.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 교정하기 버튼 */}
        <div className="w-full px-10 flex justify-center mt-9">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`
              w-full max-w-[720px] h-[66px] flex items-center justify-center gap-2.5
              rounded-2xl text-2xl font-bold leading-8 tracking-tight
              transition-colors
              ${
                canSubmit
                  ? 'bg-background-inverse text-text-inverse hover:bg-background-hover-2 active:bg-background-pressed-2'
                  : 'bg-background-disabled border border-border-disabled text-text-disabled cursor-not-allowed'
              }
            `}
          >
            <Icon name="pencil-ai" size={24} color="currentColor" />
            교정하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
