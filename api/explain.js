export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { word, context } = req.body;
  if (!word || !context) return res.status(400).json({ error: '필수 파라미터 누락' });

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
          content: `회의 중 "${word}"라는 단어가 나왔어. 문맥을 보고 이 상황의 정확한 의미를 설명해줘.\n\n문맥: "${context}"\n\n조건:\n- 동음이의어는 문맥에 맞는 의미만\n- 3문장 이내\n- 첫 줄 한 줄 요약, 이후 부연설명`
        }]
      })
    });

    const data = await response.json();
    const explanation = data.content.map(b => b.text || '').join('').trim();
    res.status(200).json({ explanation });
  } catch (err) {
    res.status(500).json({ error: '서버 오류' });
  }
}
