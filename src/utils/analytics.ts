/**
 * Amplitude Analytics 유틸리티
 *
 * 사용법:
 * - 초기화: main.tsx에서 initAnalytics() 호출
 * - 이벤트 추적: trackEvent('이벤트명', { 속성 }) 호출
 *
 * autocapture: true 설정으로 아래 항목은 자동 수집됩니다.
 * - 페이지 진입/이탈
 * - 클릭 이벤트
 * - 세션 시작/종료
 * - Session Replay (100% 샘플링)
 */

import * as amplitude from '@amplitude/unified';

// =============================================================
// 초기화
// =============================================================

export const initAnalytics = (): void => {
  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;

  if (!apiKey) {
    console.error('[Analytics] VITE_AMPLITUDE_API_KEY가 설정되지 않았습니다.');
    return;
  }

  amplitude.initAll(apiKey, {
    analytics: {
      autocapture: true, // 클릭, 페이지뷰 자동 수집
    },
    sessionReplay: {
      sampleRate: 1, // 100% 세션 녹화
    },
  });
};

// =============================================================
// 커스텀 이벤트 추적
// =============================================================

type EventProperties = Record<string, string | number | boolean | null>;

/**
 * 커스텀 이벤트를 Amplitude로 전송합니다.
 *
 * @example
 * trackEvent('correction_requested', { receiver_type: 'CLIENT', purpose: 'NOTICE' });
 */
export const trackEvent = (
  eventName: string,
  properties?: EventProperties
): void => {
  amplitude.track(eventName, properties);
};

// =============================================================
// 이벤트 상수 — 오타 방지용
// =============================================================

export const ANALYTICS_EVENTS = {
  // 교정 흐름
  CORRECTION_REQUESTED: 'correction_requested', // 교정 요청
  CORRECTION_CHANGE_ACCEPTED: 'correction_change_accepted', // 교정 수락
  CORRECTION_CHANGE_REJECTED: 'correction_change_rejected', // 교정 거절
  CORRECTION_FINALIZED: 'correction_finalized', // 다듬기 완료
  CORRECTION_CONFIRMED: 'correction_confirmed', // 복사하기 (최종 확정)

  // 사용자 행동
  EMAIL_COPIED: 'email_copied', // 이메일 복사
  NEW_CORRECTION_STARTED: 'new_correction_started', // 새 교정 시작
} as const;
