/**
 * Footer
 * - 공통 푸터 컴포넌트
 * - 좌측: CopyRight
 * - 우측: 이용약관 / 개인정보처리방침 / 고객센터 링크
 *
 */
export default function Footer() {
  return (
    <footer
      className="
        flex items-center justify-between
        bg-background-page
        border-t border-border-default
        rounded-bl-2xl rounded-br-2xl
        px-5 py-4
      "
      style={{ boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.07)' }}
    >
      {/* ── 저작권 문구 ────────────────────────────────────── */}
      <div className="p-2.5">
        <p className="text-base leading-6 font-normal tracking-tight text-text-tertiary whitespace-nowrap">
          © 2026 ToneFit Inc. All rights reserved.
        </p>
      </div>

      {/* ── 링크 영역 ─────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 p-2.5">
        {/* TODO: 각 링크 경로 확정 후 ROUTES 상수 + <Link>로 교체 */}
        <button
          type="button"
          className="text-base leading-6 font-normal tracking-tight text-text-tertiary hover:text-text-secondary transition-colors whitespace-nowrap cursor-pointer"
        >
          이용약관
        </button>
        <button
          type="button"
          className="text-base leading-6 font-normal tracking-tight text-text-tertiary hover:text-text-secondary transition-colors whitespace-nowrap cursor-pointer"
        >
          개인정보처리방침
        </button>
        <button
          type="button"
          className="text-base leading-6 font-normal tracking-tight text-text-tertiary hover:text-text-secondary transition-colors whitespace-nowrap cursor-pointer"
        >
          고객센터
        </button>
      </div>
    </footer>
  );
}
