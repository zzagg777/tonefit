import { Routes, Route, Navigate } from 'react-router-dom';
// import Layout from '@/components/layout/Layout';
// import AuthLayout from '@/components/layout/AuthLayout';
import Layout from '@/components/layout/Layout';
// import LoginPage from '@/pages/auth/LoginPage';
// import JoinAcceptPage from '@/pages/auth/JoinAcceptPage';
// import JoinInfoPage from '@/pages/auth/JoinInfoPage';
// import JoinCompletePage from '@/pages/auth/JoinCompletePage';
// import DashboardPage from '@/pages/home/DashboardPage';
import EditorPage from '@/pages/home/EditorPage';
import EditorProcessingPage from '@/pages/home/EditorProcessingPage';
import EditorResultPage from '@/pages/home/EditorResultPage';
// import HistoryPage from '@/pages/home/HistoryPage';
// import SettingsPage from '@/pages/home/SettingsPage';
// import PricingPage from '@/pages/home/PricingPage';
import { ROUTES } from '@/constants';

// ── [DEV ONLY] 컴포넌트 확인 페이지 ─────────────────────────────
// ⚠️  프로덕션 배포 전 아래 import를 주석 처리하세요.
import ComponentPage from '@/pages/dev/ComponentPage';
// ─────────────────────────────────────────────────────────────────

/**
 * App
 *
 * 애플리케이션 최상위 라우팅을 정의합니다.
 *
 * 라우트 구조:
 *
 * /                         → /auth 로 리다이렉트 (임시)
 *
 * [AuthLayout] — 인증 카드 레이아웃
 *   /auth                   → LoginPage
 *   /join/accept            → JoinAcceptPage  (약관 동의)
 *   /join/info              → JoinInfoPage    (회원 정보 입력)
 *
 * [홈 — 레이아웃 미정]
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
        {/* MVP를 위한 임시삭제 */}
        {/* <Route path={ROUTES.HISTORY} element={<HistoryPage />} /> */}
        {/* <Route path={ROUTES.SETTINGS} element={<SettingsPage />} /> */}
        {/* <Route path={ROUTES.PRICING} element={<PricingPage />} /> */}
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
