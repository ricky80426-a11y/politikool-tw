import https from 'https';

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

    const result = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'generativelanguage.' + 'googleapis.com',
          path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
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
