/**
 * DEV_LOG 디버그 로그 유틸
 *
 * true  → API 요청/응답/에러 + 로딩 페이지 진단 로그 출력
 * false → 모든 로그 무음 (기본값)
 *
 * 확인 후 반드시 false로 되돌려 주세요.
 */
export const DEV_LOG = false;

type LogArgs = Parameters<typeof console.log>;

export const devLog = (...args: LogArgs): void => {
  // eslint-disable-next-line no-console
  if (DEV_LOG) console.log(...args);
};

export const devWarn = (...args: LogArgs): void => {
  if (DEV_LOG) console.warn(...args);
};

export const devError = (...args: LogArgs): void => {
  if (DEV_LOG) console.error(...args);
};
