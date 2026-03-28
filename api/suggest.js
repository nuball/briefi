const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '로그인이 필요해요' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: '인증 실패' });

  const { transcript, lang } = req.body;
  if (!transcript) return res.status(400).json({ error: '필수 파라미터 누락' });

  const isKorean = lang !== 'en';
  const prompt = isKorean
    ? `다음은 진행 중인 회의 내용이야. 지금 이 상황에서 내가 할 수 있는 발언 3가지를 제안해줘.\n\n조건:\n- 각 제안은 실제로 말할 수 있는 한 문장\n- 상황에 맞게 구체적으로\n- 번호(1. 2. 3.)로 시작\n- 번호와 문장만, 설명 없이\n\n회의 내용:\n${transcript}`
    : `Below is an ongoing meeting. Suggest 3 things I could say right now.\n\nRules:\n- Each suggestion is one sentence I could actually say\n- Be specific to the context\n- Start with numbers (1. 2. 3.)\n- Numbers and sentences only, no explanations\n\nMeeting content:\n${transcript}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const suggestions = data.content.map(b => b.text || '').join('').trim();
    res.status(200).json({ suggestions });
  } catch {
    res.status(500).json({ error: '서버 오류' });
  }
};
