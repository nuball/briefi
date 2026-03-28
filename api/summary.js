export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { transcript, isFinal } = req.body;
  if (!transcript) return res.status(400).json({ error: '필수 파라미터 누락' });

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
        messages: [{
          role: 'user',
          content: `다음 회의 내용을 3~5개 불릿으로 요약해줘.\n\n조건:\n- 각 포인트는 한 문장\n- 결정사항, 논의사항, 액션아이템 위주\n- 각 포인트는 "•"로 시작\n- 불릿만, 다른 설명 없이\n\n회의 내용:\n${transcript}`
        }]
      })
    });

    const data = await response.json();
    const summary = data.content.map(b => b.text || '').join('').trim();
    res.status(200).json({ summary });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
}
