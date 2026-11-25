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
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({ statusCode: res.statusCode, body });
        });
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
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: fallbackResult.body,
      };
    }

    return {
      statusCode: result.statusCode,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: result.body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
