import https from 'https';

function callGeminiModel(modelName, apiKey, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'generativelanguage.' + 'googleapis.com',
        path: `/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing GEMINI_API_KEY' }) };
  }

  try {
    const body = JSON.parse(event.body);

    // 關閉深度思考（thinkingBudget: 0）讓寫稿速度提升 10 倍，避免超過 Netlify 30 秒連線上限
    const fastPayload = JSON.stringify({
      contents: body.contents,
      systemInstruction: body.systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2500,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const result = await callGeminiModel('gemini-4-hydrogen', apiKey, fastPayload);

    // 若遇到 503 尖峰忙碌，改用無 thinkingConfig 的標準呼叫並切換備援模型
    if (result.statusCode !== 200) {
      const fallbackPayload = JSON.stringify({
        contents: body.contents,
        systemInstruction: body.systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 2500,
        },
      });
      const fallbackResult = await callGeminiModel('gemini-3.8-flash', apiKey, fallbackPayload);
      return {
        statusCode: fallbackResult.statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: fallbackResult.body,
      };
    }

    return {
      statusCode: result.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: result.body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
