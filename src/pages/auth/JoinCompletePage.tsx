import { useNavigate } from 'react-router-dom';

import Stepper from '@/components/ui/Stepper';
import TitleText from '@/components/ui/TitleText';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import joinCompleteSvg from '@/assets/joinComplete.svg';

/**
 * JoinCompletePage
 *
 * 회원가입 완료 페이지입니다.
 * 경로: /join/complete
 * 디자인 기준: Figma node 654-8687
 *
 * 화면 구성 (위→아래):
 *   1. Stepper      — step=4 (모든 단계 완료: 세 원 모두 체크마크)
 *   2. 축하 이미지   — 300×300 px
 *   3. TitleText    — "안녕하세요 [이름]님, 가입이 완료됐어요!" + 안내 문구
 *   4. Button       — "톤핏 로그인하기" (전체 너비, primary)
 *
 * TODO: 유저 이름은 회원가입 성공 응답(SignupResponse) 또는
 *       전역 상태(Zustand userStore)에서 가져와야 합니다.
 */
const JoinCompletePage = () => {
  const navigate = useNavigate();

  return (
    <div className="join-complete max-w-135 w-full flex flex-col items-center gap-16">
      {/* ── 진행 단계 표시 ─────────────────────────────────────── */}
      {/*
       * step=4: 모든 단계 완료
       * 세 원 모두 체크마크, 두 연결선 모두 진한 색
       */}
      <Stepper step={4} />

      {/* ── 축하 이미지 ──────────────────────────────────────────── */}
      <img
        src={joinCompleteSvg}
        alt="가입 완료 축하 이미지"
        width={300}
        height={300}
        className="size-[300px] object-contain"
      />

      {/* ── 타이틀 + 안내 문구 ─────────────────────────────────── */}
      {/*
       * heading: Display/L (36px Bold, 44px line-height, -0.02em tracking)
       * subtitle: Body/L (16px Regular, 24px line-height)
       * TODO: "김준형" 자리를 SignupResponse.nickname 또는 userStore.name 으로 교체
       */}
      <TitleText
        heading={
          <>
            안녕하세요 김준형님,
            <br />
            가입이 완료됐어요!
          </>
        }
        subtitle="이제 상사에게, 거래처에, 그 상황에 딱 맞는 이메일을 톤핏과 함께 작성해 보세요."
      />

      {/* ── 로그인 버튼 ──────────────────────────────────────────── */}
      {/*
       * Button 기본 스펙: h-[66px] / rounded-2xl / 전체 너비
       * variant="default" → bg-background-inverse + text-text-inverse
       */}
      <Button
        type="button"
        variant="default"
        onClick={() => navigate(ROUTES.LOGIN)}
      >
        톤핏 로그인하기
      </Button>
    </div>
  );
};

export default JoinCompletePage;
