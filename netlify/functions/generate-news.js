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
    const payload = JSON.stringify({
      contents: body.contents,
      systemInstruction: body.systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
      },
    });

    // 優先使用 gemini-4-hydrogen，若遇到 503/429 滿載則自動無縫切換至 gemini-3.8-flash
    const models = ['gemini-4-hydrogen', 'gemini-3.8-flash'];
    let lastResult = { statusCode: 500, body: '{}' };

    for (const model of models) {
      const result = await callGeminiModel(model, apiKey, payload);
      lastResult = result;
      if (result.statusCode === 200) {
        break;
      }
    }

    return {
      statusCode: lastResult.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: lastResult.body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
