import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES, STORAGE_KEYS } from '@/constants';
import { issueAnonymousToken } from '@/api';
// ─────────────────────────────────────────────────────────────────
// import 페이지
// home - 공용레이아웃, 교정시작, 교정로딩, 교정비교, 교정완료(로딩), 교정결과
import Layout from '@/components/layout/Layout';
import EditorPage from '@/pages/home/EditorPage';
import EditorProcessingPage from '@/pages/home/EditorProcessingPage';
import EditorResultPage from '@/pages/home/EditorResultPage';
import EditorConfirmLoadingPage from '@/pages/home/EditorConfirmLoadingPage';
import EditorDonePage from '@/pages/home/EditorDonePage';
// ─────────────────────────────────────────────────────────────────
// [DEV ONLY] 컴포넌트 확인 페이지
import ComponentPage from '@/pages/dev/ComponentPage';
// ─────────────────────────────────────────────────────────────────

/**
 * App
 *
 * 애플리케이션 최상위 라우팅을 정의합니다.
 *
 * 라우트 구조:
 *
 * /                         → /home/editor 로 리다이렉트 (임시)
 *
 * [AuthLayout] — 인증 카드 레이아웃
 *   /auth                   → LoginPage
 *   /join/accept            → JoinAcceptPage  (약관 동의)
 *   /join/info              → JoinInfoPage    (회원 정보 입력)
 *
 * [Layout]
 *   /home                   → DashboardPage
 *   /home/editor            → EditorPage
 *   /home/editor/processing → EditorProcessingPage
 *   /home/editor/result     → EditorResultPage
 *   /home/history           → HistoryPage
 *   /home/settings          → SettingsPage
 *   /home/pricing           → PricingPage
 *
 * TODO: 로그인 여부에 따른 ProtectedRoute / GuestRoute 구현
 */
const App = () => {
  // StrictMode 이중 호출 방지용 플래그
  const issuedRef = useRef(false);

  useEffect(() => {
    // ── [DEV] 임시 토큰 하드코딩 ──────────────────────────────────────────
    // 백엔드에서 /auth/anonymous 엔드포인트가 준비되기 전까지만 사용
    // 준비되면 이 블록을 삭제하고 아래 issueAnonymousToken() 블록을 활성화하세요.
    const DEV_TEST_TOKEN = {
      access:
        'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwiaXNfZ3Vlc3QiOmZhbHNlLCJpYXQiOjE3NzgwNTE1MTMsImV4cCI6MTc3ODA1NTExM30.gNK04u89FE06MfVPiHqxIrTDcpXFECdaSTrvWtbxagSooQarIQgiTC0oaX6aHnmIsj02ND36MaRaXrQOSMYOAQ',
      refresh:
        'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzc4MDUxNTEzLCJleHAiOjE3Nzg2NTYzMTN9.Pk48bYgTGFHHjIhOqZxBM3XE_kxY-1hlxAnHSFGNeYX4mJbducvvf5o-d02-55voJeQOEBMX6G_DActahrsR6w',
    }; // TODO: 만료 시 재발급 필요
    if (import.meta.env.DEV && DEV_TEST_TOKEN.access) {
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, DEV_TEST_TOKEN.access);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, DEV_TEST_TOKEN.refresh);
      console.log('[App] DEV 임시 토큰 적용됨');
      return;
    }
    // ──────────────────────────────────────────────────────────────────────

    // 이미 발급된 토큰이 있으면 재발급 불필요
    const existingToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (existingToken) return;

    // StrictMode에서 effect가 두 번 실행되는 것 방지
    if (issuedRef.current) return;
    issuedRef.current = true;

    // 익명 토큰 발급 (FUNC-NON-01, 02)
    // 앱 최초 진입 시 서버에서 임시 userId + 토큰 발급
    issueAnonymousToken().catch((error) => {
      // 네트워크 오류 등 발급 실패 — 사용자는 그냥 진행하되 API 호출 시 실패 처리
      console.error('[App] 익명 토큰 발급 실패:', error);
      issuedRef.current = false; // 재시도 허용
    });
  }, []);

  return (
    <Routes>
      {/* 루트 경로: 교정하기로 임시 리다이렉트 */}
      <Route
        path={ROUTES.HOME}
        element={<Navigate to={ROUTES.EDITOR} replace />}
      />

      {/* MVP를 위한 임시삭제 */}
      {/* ── 인증 라우트 (AuthLayout 적용: 카드 레이아웃) ── */}
      {/* <Route element={<AuthLayout variant="center" />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      </Route>

      <Route element={<AuthLayout variant="top" />}>
        <Route path={ROUTES.JOIN_ACCEPT} element={<JoinAcceptPage />} />
        <Route path={ROUTES.JOIN_INFO} element={<JoinInfoPage />} />
        <Route path={ROUTES.JOIN_COMPLETE} element={<JoinCompletePage />} />
      </Route> */}

      {/* ── 홈 라우트 ────────────────────────────────────── */}

      <Route element={<Layout />}>
        {/* 홈 경로: 교정하기로 임시 리다이렉트 */}
        {/* <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} /> */}
        <Route
          path={ROUTES.DASHBOARD}
          element={<Navigate to={ROUTES.EDITOR} replace />}
        />
        <Route path={ROUTES.EDITOR} element={<EditorPage />} />
        <Route
          path={ROUTES.EDITOR_PROCESSING}
          element={<EditorProcessingPage />}
        />
        <Route path={ROUTES.EDITOR_RESULT} element={<EditorResultPage />} />
        <Route
          path={ROUTES.EDITOR_CONFIRM_LOADING}
          element={<EditorConfirmLoadingPage />}
        />
        <Route path={ROUTES.EDITOR_DONE} element={<EditorDonePage />} />
        {/* MVP를 위한 임시삭제 */}
        {/* <Route path={ROUTES.HISTORY} element={<HistoryPage />} /> */}
        {/* <Route path={ROUTES.SETTINGS} element={<SettingsPage />} /> */}
        {/* <Route path={ROUTES.PRICING} element={<PricingPage />} /> */}
        <Route
          path={ROUTES.HISTORY}
          element={<Navigate to={ROUTES.EDITOR} replace />}
        />
        <Route
          path={ROUTES.SETTINGS}
          element={<Navigate to={ROUTES.EDITOR} replace />}
        />
        <Route
          path={ROUTES.PRICING}
          element={<Navigate to={ROUTES.EDITOR} replace />}
        />
      </Route>

      {/* ── [DEV ONLY] 컴포넌트 확인 페이지 ───────────────────
          ⚠️  프로덕션 배포 전 아래 Route를 주석 처리하세요.
          (위의 import ComponentPage도 함께 주석 처리)
          빌드 사이즈 최소화를 위해 두 줄 모두 비활성화합니다. */}
      <Route path="/dev/components" element={<ComponentPage />} />
      {/* ────────────────────────────────────────────────────── */}
    </Routes>
  );
};

export default App;
