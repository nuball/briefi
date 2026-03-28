const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FREE_LIMIT = 600; // 10분 = 600초

module.exports = async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '로그인이 필요해요' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: '인증 실패' });

  const today = new Date().toISOString().split('T')[0];

  // GET: 오늘 사용량 조회
  if (req.method === 'GET') {
    const { data } = await supabase
      .from('usage')
      .select('seconds')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    const used = data?.seconds || 0;
    return res.status(200).json({
      used,
      remaining: Math.max(0, FREE_LIMIT - used),
      limit: FREE_LIMIT,
      expired: used >= FREE_LIMIT
    });
  }

  // POST: 사용 시간 추가
  if (req.method === 'POST') {
    const { seconds } = req.body;
    if (!seconds || seconds <= 0) return res.status(400).json({ error: '잘못된 요청' });

    const { data: existing } = await supabase
      .from('usage')
      .select('seconds')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    const newTotal = (existing?.seconds || 0) + seconds;

    if (existing) {
      await supabase.from('usage').update({ seconds: newTotal })
        .eq('user_id', user.id).eq('date', today);
    } else {
      await supabase.from('usage').insert({ user_id: user.id, date: today, seconds });
    }

    return res.status(200).json({
      used: newTotal,
      remaining: Math.max(0, FREE_LIMIT - newTotal),
      expired: newTotal >= FREE_LIMIT
    });
  }

  res.status(405).end();
};
