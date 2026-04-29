import { http, HttpResponse, delay } from 'msw';
import type { CorrectionResponse } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

// 피그마 디자인 기준 원문 (EditorProcessingPage MOCK_STATE와 동일하게 유지)
// node-id: 1453:26842
const MOCK_ORIGINAL =
  '김철수 팀장님께,\n안녕하십니까, 마케팅팀 윤서연입니다.\n웹사이트 리뉴얼 프로젝트 관련하여 보고드리겠습니다.\n외주업체에서 보내드리실 견적서가 아직 도착하지 않아 일정이 지연되고 있는 상황입니다.\n확인되어졌으며, 빠른 시일 내에 전달드리도록 하겠습니다.\n검토 부탁드리실게요.';

const MOCK_CORRECTED =
  '김철수 팀장님께,\n안녕하십니까, 마케팅팀 윤서연입니다.\n웹사이트 리뉴얼 프로젝트 관련하여 보고드리겠습니다.\n외주업체에서 보내줄 견적서가 아직 도착하지 않아 일정이 지연되고 있는 상황입니다.\n확인되었으며, 빠른 시일 내로 전달드리겠습니다.\n검토 부탁드리겠습니다.';

export const MOCK_CORRECTION_RESPONSE: CorrectionResponse = {
  session_id: 1,
  round: 1,
  corrected_email: MOCK_CORRECTED,
  changes: [
    {
      index: 0,
      start: 67,
      end: 72,
      original: '보내드리실',
      corrected: '보내줄',
      reason:
        '상대방의 행동에 대한 과도한 높임 표현인 보내드리실은 비즈니스 문법에 어긋납니다. 보내줄 또는 보내주실로 수정하는 것이 자연스럽습니다. (국립국어원 표준 언어 예절)',
      label: 'AUTO',
      action: null,
    },
    {
      index: 1,
      start: 108,
      end: 115,
      original: '확인되어졌으며',
      corrected: '확인되었으며',
      reason:
        "'되어졌다'는 피동 표현이 이중으로 겹친 비문입니다. '되었다'로 단순화하는 것이 올바른 표현입니다. (국립국어원 온라인 가나다)",
      label: 'AUTO',
      action: null,
    },
    {
      index: 2,
      start: 117,
      end: 125,
      original: '빠른 시일 내에',
      corrected: '빠른 시일 내로',
      reason:
        "'빠른 시일 내로'가 현대 표준 국어 문법에서 더 자연스러운 표현입니다. (국립국어원 온라인 가나다)",
      label: 'SUGGEST',
      action: null,
    },
    {
      index: 3,
      start: 126,
      end: 138,
      original: '전달드리도록 하겠습니다',
      corrected: '전달드리겠습니다',
      reason:
        "'전달드리도록 하겠습니다'보다 '전달드리겠습니다'가 더 간결하고 명확한 표현입니다.",
      label: 'STYLE',
      action: null,
    },
    {
      index: 4,
      start: 143,
      end: 150,
      original: '부탁드리실게요',
      corrected: '부탁드리겠습니다',
      reason:
        "'드리실게요'는 표준어가 아닌 구어체 표현입니다. 비즈니스 이메일에서는 '부탁드리겠습니다'와 같은 하십시오체를 사용해야 합니다. (국립국어원 표준 언어 예절)",
      label: 'AUTO',
      action: null,
    },
  ],
  created_at: new Date().toISOString(),
};

export const handlers = [
  http.post(`${BASE_URL}/corrections`, async () => {
    await delay(2000);
    return HttpResponse.json(MOCK_CORRECTION_RESPONSE, { status: 201 });
  }),

  http.post(
    `${BASE_URL}/corrections/:sessionId/confirm`,
    async ({ params }) => {
      await delay(600);
      return HttpResponse.json(
        {
          session_id: Number(params.sessionId),
          copied_at: new Date().toISOString(),
        },
        { status: 200 }
      );
    }
  ),
];

export { MOCK_ORIGINAL };
