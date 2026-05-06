/**
 * 초안 암호화 저장 유틸리티 (FUNC-NON-07)
 *
 * Web Crypto API(외부 라이브러리 없음)를 사용하여
 * 이메일 초안을 AES-GCM 방식으로 암호화한 후 localStorage에 저장합니다.
 *
 * 암호화 전략:
 * - 알고리즘  : AES-GCM (256-bit)
 * - 키 파생   : PBKDF2 (SHA-256, 100,000 iterations)
 * - IV        : 요청마다 12바이트 랜덤 생성, 암호문 앞에 붙여서 함께 저장
 * - 저장 형식  : base64(iv[12bytes] + ciphertext)
 * - 키 소재   : 환경변수 VITE_DRAFT_ENCRYPT_KEY (없으면 빌트인 fallback)
 *
 * @module utils/storage
 */

import { STORAGE_KEYS } from '@/constants';

// =============================================================
// 내부 상수
// =============================================================

/** AES-GCM IV 길이 (바이트) */
const IV_LENGTH = 12;

/** PBKDF2 반복 횟수 */
const PBKDF2_ITERATIONS = 100_000;

/** PBKDF2 고정 salt (앱별 고유값 — 키 재사용 방지) */
const SALT = 'tonefit-draft-salt-v1';

/**
 * 키 파생 소재
 * 환경변수가 설정되어 있으면 사용하고, 없으면 앱 내장 기본값 사용
 */
const KEY_MATERIAL =
  (import.meta as ImportMeta & { env: Record<string, string> }).env
    .VITE_DRAFT_ENCRYPT_KEY ?? 'tonefit-draft-default-key-v1';

// =============================================================
// 내부 유틸
// =============================================================

/**
 * Uint8Array → base64 문자열로 변환
 */
const toBase64 = (buf: Uint8Array): string => btoa(String.fromCharCode(...buf));

/**
 * base64 문자열 → Uint8Array로 변환
 */
const fromBase64 = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/**
 * 키 소재 문자열에서 AES-GCM CryptoKey를 파생합니다.
 * PBKDF2를 사용하여 brute-force 공격에 대한 내성을 높입니다.
 *
 * @returns AES-GCM 256-bit CryptoKey
 */
const deriveKey = async (): Promise<CryptoKey> => {
  const enc = new TextEncoder();

  // 1) 키 소재 import
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(KEY_MATERIAL),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // 2) PBKDF2로 AES-GCM 키 파생
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // 키 추출 불가
    ['encrypt', 'decrypt']
  );
};

// =============================================================
// 공개 API
// =============================================================

/**
 * 문자열을 AES-GCM으로 암호화하여 base64 문자열로 반환합니다.
 *
 * @param text 암호화할 평문 문자열
 * @returns base64 인코딩된 암호문 (IV 12바이트 포함)
 *
 * @example
 * const cipher = await encryptDraft('안녕하세요, 이메일 초안입니다.');
 * // → 'abc123...==' (base64)
 */
export const encryptDraft = async (text: string): Promise<string> => {
  const enc = new TextEncoder();
  const key = await deriveKey();

  // 요청마다 다른 IV 생성 (재사용 금지)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  // IV + 암호문을 하나의 배열로 합쳐서 base64 인코딩
  const combined = new Uint8Array(IV_LENGTH + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), IV_LENGTH);

  return toBase64(combined);
};

/**
 * base64 암호문을 AES-GCM으로 복호화하여 평문 문자열로 반환합니다.
 *
 * @param cipher `encryptDraft`가 반환한 base64 문자열
 * @returns 복호화된 평문 문자열
 * @throws 키 불일치 또는 손상된 데이터일 경우 에러 throw
 *
 * @example
 * const plain = await decryptDraft(cipher);
 * // → '안녕하세요, 이메일 초안입니다.'
 */
export const decryptDraft = async (cipher: string): Promise<string> => {
  const dec = new TextDecoder();
  const key = await deriveKey();

  const combined = fromBase64(cipher);
  const iv = combined.slice(0, IV_LENGTH);
  const cipherBuf = combined.slice(IV_LENGTH);

  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherBuf
  );

  return dec.decode(plainBuf);
};

/**
 * 이메일 초안을 암호화하여 localStorage에 저장합니다.
 *
 * @param text 저장할 초안 평문
 *
 * @example
 * await saveDraft('작성 중인 이메일 내용...');
 */
export const saveDraft = async (text: string): Promise<void> => {
  const cipher = await encryptDraft(text);
  localStorage.setItem(STORAGE_KEYS.DRAFT_CIPHER, cipher);
};

/**
 * localStorage에서 암호화된 초안을 읽어 복호화하여 반환합니다.
 * 저장된 초안이 없으면 `null`을 반환합니다.
 *
 * @returns 복호화된 초안 문자열 또는 null
 *
 * @example
 * const draft = await loadDraft();
 * if (draft) {
 *   setEmailText(draft);
 * }
 */
export const loadDraft = async (): Promise<string | null> => {
  const cipher = localStorage.getItem(STORAGE_KEYS.DRAFT_CIPHER);
  if (!cipher) return null;

  try {
    return await decryptDraft(cipher);
  } catch {
    // 복호화 실패 시 (키 변경, 데이터 손상 등) 초안 삭제 후 null 반환
    console.error('[storage] 초안 복호화 실패 — 저장된 초안을 삭제합니다.');
    localStorage.removeItem(STORAGE_KEYS.DRAFT_CIPHER);
    return null;
  }
};

/**
 * localStorage에서 암호화된 초안을 삭제합니다.
 *
 * @example
 * // 교정 확정 후 초안 정리
 * clearDraft();
 */
export const clearDraft = (): void => {
  localStorage.removeItem(STORAGE_KEYS.DRAFT_CIPHER);
};
