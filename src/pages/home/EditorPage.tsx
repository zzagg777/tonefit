import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TitleText from '@/components/ui/TitleText';
import { Icon, Button } from '@/components/ui';
import {
  ROUTES,
  RECEIVER_TYPE_LABELS,
  PURPOSE_LABELS,
  INPUT_LIMITS,
  VALIDATION_MESSAGES,
} from '@/constants';
import type { ReceiverType, PurposeType } from '@/types';
import { saveStorage, getStorageItem, deleteAllStorage } from '@/api/storage';

const DRAFT_KEY = 'tonefit_editor_draft';

interface EditorDraft {
  receiver: ReceiverType | null;
  purpose: PurposeType | null;
  emailText: string;
  savedAt?: string;
}

function loadDraft(): EditorDraft | null {
  const draft = getStorageItem<EditorDraft>(DRAFT_KEY);
  if (!draft) return null;
  if (!draft.receiver && !draft.purpose && !draft.emailText) return null;
  return draft;
}

function getHoursAgo(savedAt?: string): string {
  if (!savedAt) return '이전';
  const hours = Math.floor(
    (Date.now() - new Date(savedAt).getTime()) / 3_600_000
  );
  return hours < 1 ? '방금' : `${hours}시간`;
}

function getDraftPreview(emailText: string, maxLen = 30): string {
  const oneLine = emailText.replace(/\n/g, ' ').trim();
  return oneLine.length > maxLen ? `${oneLine.slice(0, maxLen)}....` : oneLine;
}

const saveDraft = (draft: EditorDraft) =>
  saveStorage(DRAFT_KEY, { ...draft, savedAt: new Date().toISOString() });
const clearDraft = () => deleteAllStorage(DRAFT_KEY);

/**
 * 의미 없는 입력인지 확인
 * 자음(ㄱ-ㅎ) · 모음(ㅏ-ㅣ) · 이모지 · HTML 태그 · 공백만으로 이루어진 경우 true
 * 완성된 한글 음절(가-힣), 영문, 숫자, 특수문자가 하나라도 있으면 false
 */
const isOnlyJamoOrSpaces = (text: string): boolean => {
  // HTML 태그 제거 (<div>, </br> 등)
  const withoutHtml = text.replace(/<[^>]*>/g, '');
  // 공백 제거
  const stripped = withoutHtml.replace(/\s/g, '');
  if (!stripped) return true;
  // 이모지 제거 (Extended_Pictographic: 숫자·영문 등 ASCII는 포함하지 않음)
  const withoutEmoji = stripped.replace(/\p{Extended_Pictographic}/gu, '');
  if (!withoutEmoji) return true; // 이모지(+태그)만 있는 경우
  // 나머지가 모두 한글 자모인지 확인
  return [...withoutEmoji].every((char) => {
    const code = char.charCodeAt(0);
    // 한글 자모 범위: U+3131(ㄱ) ~ U+318E
    return code >= 0x3131 && code <= 0x318e;
  });
};

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
  'REPLY',
  'DECLINE',
];

interface StepLabelProps {
  step: number;
  title: string;
}

const StepLabel = ({ step, title }: StepLabelProps) => (
  <div className="flex gap-0.5 items-center">
    <div className="w-7.5 h-7.5 rounded-full bg-background-inverse flex items-center justify-center shrink-0">
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

interface RestoredState {
  receiver?: ReceiverType;
  purpose?: PurposeType;
  emailText?: string;
  error?: string;
}

const EditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restored = (location.state as RestoredState | null) ?? null;

  const [initialDraft] = useState<EditorDraft | null>(() => loadDraft());

  const [receiver, setReceiver] = useState<ReceiverType | null>(
    restored?.receiver ?? null
  );
  const [purpose, setPurpose] = useState<PurposeType | null>(
    restored?.purpose ?? null
  );
  const [emailText, setEmailText] = useState(restored?.emailText ?? '');
  const [errors, setErrors] = useState<{
    receiver?: string;
    purpose?: string;
    email?: string;
  }>({});
  const [showDraftNoti, setShowDraftNoti] = useState(Boolean(initialDraft));
  const [apiError, setApiError] = useState<string | null>(
    restored?.error ?? null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftResolvedRef = useRef(!initialDraft);

  // ProcessingPage에서 돌아올 때 에러 메시지 표시 후 state 초기화
  useEffect(() => {
    if (restored?.error) {
      const timer = setTimeout(() => setApiError(null), 4000);
      // state에서 error 제거 (새로고침 시 재표시 방지)
      navigate(location.pathname, {
        replace: true,
        state: { ...restored, error: undefined },
      });
      return () => clearTimeout(timer);
    }
  }, []);

  const charCount = emailText.length;
  const isOverLimit = charCount > INPUT_LIMITS.EMAIL_MAX_LENGTH;
  const isTooShort = charCount > 0 && charCount < INPUT_LIMITS.EMAIL_MIN_LENGTH;
  const isIncomplete = charCount > 0 && isOnlyJamoOrSpaces(emailText);
  const canSubmit = receiver && purpose && charCount > 0;
  const hasEmailError =
    !!errors.email && (isOverLimit || isTooShort || isIncomplete);

  // 실시간 자동 저장 (알림 처리 전까지 중단)
  useEffect(() => {
    if (!draftResolvedRef.current) return;
    const timer = setTimeout(() => {
      if (receiver || purpose || emailText) {
        saveDraft({ receiver, purpose, emailText });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [receiver, purpose, emailText]);

  const handleClose = () => {
    clearDraft();
    draftResolvedRef.current = true;
    setShowDraftNoti(false);
  };

  const handleResume = () => {
    const draft = loadDraft();
    if (draft) {
      setReceiver(draft.receiver);
      setPurpose(draft.purpose);
      setEmailText(draft.emailText);
    }
    draftResolvedRef.current = true;
    setShowDraftNoti(false);
  };

  const handleSubmit = () => {
    const newErrors: typeof errors = {};
    if (!receiver) newErrors.receiver = VALIDATION_MESSAGES.RECEIVER_REQUIRED;
    if (!purpose) newErrors.purpose = VALIDATION_MESSAGES.PURPOSE_REQUIRED;
    if (!emailText) newErrors.email = VALIDATION_MESSAGES.EMAIL_REQUIRED;
    else if (isIncomplete)
      newErrors.email = VALIDATION_MESSAGES.EMAIL_INCOMPLETE_CHARS;
    else if (charCount < INPUT_LIMITS.EMAIL_MIN_LENGTH)
      newErrors.email = VALIDATION_MESSAGES.EMAIL_TOO_SHORT;
    else if (isOverLimit) newErrors.email = VALIDATION_MESSAGES.EMAIL_TOO_LONG;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    clearDraft();
    navigate(ROUTES.EDITOR_PROCESSING, {
      state: {
        receiverType: receiver,
        purposeType: purpose,
        originalEmail: emailText,
      },
    });
  };

  const chipBase =
    'flex items-center justify-center py-2.5 px-2.5 rounded-2xl text-lg font-semibold leading-6.5 tracking-tight transition-colors cursor-pointer break-keep';
  const chipSelected = 'bg-background-inverse text-text-inverse';
  const chipDefault =
    'bg-background-subtle text-text-placeholder hover:bg-background-hover-2 hover:text-text-inverse';

  return (
    <main
      id="editor"
      className="flex-1 bg-background-page flex flex-col overflow-y-auto px-10 relative"
    >
      <h1 className="sr-only">이메일 교정</h1>
      {/* draft 알림 배너 */}
      {showDraftNoti && (
        <div className="animate-slide-down overflow-hidden max-w-full bg-background-surface rounded-b-2xl shadow-[0px_4px_8px_rgba(0,0,0,0.1)] pt-6 pb-4 px-4 shrink-0 absolute left-10 right-10">
          <div className="flex gap-6 items-center">
            {/* 좌측: 아이콘 + 시간 + 미리보기 */}
            <div className="flex items-center gap-4 px-2.5 min-w-0 shrink">
              <Icon
                name="info"
                size={24}
                className="text-text-secondary shrink-0"
              />
              <span className="text-xl font-semibold leading-7 tracking-tight text-text-secondary whitespace-nowrap shrink-0">
                {getHoursAgo(initialDraft?.savedAt)} 전에 작성하던 이메일이
                있어요
              </span>
              {initialDraft?.emailText && (
                <span className="text-base font-semibold leading-6 tracking-tight text-text-tertiary truncate min-w-0">
                  "{getDraftPreview(initialDraft.emailText)}"
                </span>
              )}
            </div>
            {/* 우측: 버튼 */}
            <div className="flex items-center justify-end gap-2.5 shrink-0 ml-auto">
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center justify-center bg-background-muted text-text-tertiary rounded-md py-2 px-5 text-base font-medium leading-6 tracking-tight hover:bg-background-hover cursor-pointer transition-colors whitespace-nowrap"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleResume}
                className="flex items-center justify-center bg-background-inverse text-text-inverse rounded-md py-2 px-5 text-base font-medium leading-6 tracking-tight hover:opacity-90 cursor-pointer transition-opacity whitespace-nowrap"
              >
                이어서 작성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <div className="flex flex-col gap-11 items-start w-full  flex-1 pt-25">
        {/* 타이틀 */}
        <TitleText
          heading="이메일 교정"
          subtitle="작성하신 이메일을 대상과 상황에 맞춰 완벽하게 다듬어 드립니다."
          align="left"
        />

        {/* 메인 레이아웃: 좌측(수신자/목적) + 우측(이메일 입력) */}
        <div className="flex gap-20 items-start w-full flex-1 min-h-0 max-lg:gap-3.5 max-lg:flex-col">
          {/* 좌측: 수신자 + 목적 선택 */}
          <div className="max-lg:flex-auto flex-1 flex flex-col gap-3.5 min-w-0 max-lg:w-full">
            {/* 수신자 유형 */}
            <div className="flex flex-col gap-4 w-full">
              <StepLabel step={1} title="수신자 유형 선택" />
              <div className="flex flex-col gap-2 w-full">
                <div className="grid grid-cols-4 gap-3 w-full">
                  {RECEIVER_OPTIONS.map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={receiver === type}
                      onClick={() => {
                        setReceiver((prev) => (prev === type ? null : type));
                        setErrors((e) => ({ ...e, receiver: undefined }));
                      }}
                      className={`${chipBase} ${receiver === type ? chipSelected : chipDefault}`}
                    >
                      {RECEIVER_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
                {errors.receiver && (
                  <p className="text-sm text-text-danger leading-5.5 tracking-tight px-2.5">
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
                      aria-pressed={purpose === type}
                      onClick={() => {
                        setPurpose((prev) => (prev === type ? null : type));
                        setErrors((e) => ({ ...e, purpose: undefined }));
                      }}
                      className={`${chipBase} ${purpose === type ? chipSelected : chipDefault}`}
                    >
                      {PURPOSE_LABELS[type]}
                    </button>
                  ))}
                </div>
                {errors.purpose && (
                  <p className="text-sm text-text-danger leading-5.5 tracking-tight px-2.5">
                    {errors.purpose}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 이메일 원문 입력 */}
          <div className="max-lg:flex-auto flex-1 flex flex-col gap-4 h-full min-w-0 max-lg:w-full">
            <StepLabel step={3} title="이메일 원문 입력" />

            <div className="flex-1 flex flex-col gap-2.5 min-h-0">
              {/* 텍스트 영역 */}
              <div className="flex-1 flex flex-col min-h-0">
                <div
                  className={`flex-1 bg-background-subtle rounded-lg px-6 py-5 relative max-md:min-h-48 min-h-100 border ${hasEmailError ? 'border-border-danger' : 'border-transparent'}`}
                >
                  <textarea
                    ref={textareaRef}
                    value={emailText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmailText(val);
                      const len = val.length;
                      if (
                        len === 0 ||
                        (len >= INPUT_LIMITS.EMAIL_MIN_LENGTH &&
                          len <= INPUT_LIMITS.EMAIL_MAX_LENGTH)
                      ) {
                        setErrors((err) => ({ ...err, email: undefined }));
                      }
                    }}
                    placeholder="교정할 이메일 원문을 붙여넣어 주세요."
                    className={`w-full h-full resize-none bg-transparent text-lg font-semibold leading-6.5 tracking-tight placeholder:text-text-placeholder outline-none ${hasEmailError ? 'text-text-danger' : 'text-text-secondary'}`}
                  />
                </div>
              </div>

              {/* 에러 + 글자 수 */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {errors.email && (
                    <p
                      key={errors.email}
                      className="animate-shake flex gap-1 items-center text-sm text-text-danger leading-5.5 tracking-tight px-2.5"
                    >
                      <Icon name="info" size={14} />
                      {errors.email}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 items-center">
                  <span
                    className={`text-sm leading-5.5 tracking-tight ${isOverLimit ? 'text-text-danger' : 'text-text-primary'}`}
                  >
                    {charCount.toLocaleString()}
                  </span>
                  <span className="text-sm leading-5.5 tracking-tight text-text-disabled">
                    /
                  </span>
                  <span className="text-sm leading-5.5 tracking-tight text-text-tertiary">
                    {INPUT_LIMITS.EMAIL_MAX_LENGTH.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 교정하기 버튼 */}
      <div className="relative w-full flex justify-center mt-9 pb-20">
        {/* API 오류 토스트 — 버튼 컨테이너 기준으로 센터 정렬 */}
        {apiError && (
          <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 z-50 bg-background-inverse text-text-inverse px-6 py-3 rounded-full text-base font-semibold leading-6 tracking-tight shadow-lg whitespace-nowrap pointer-events-none">
            {apiError}
          </div>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`max-w-180`}
        >
          <Icon name="pencil-ai" size={24} color="currentColor" />
          교정하기
        </Button>
      </div>
    </main>
  );
};

export default EditorPage;
