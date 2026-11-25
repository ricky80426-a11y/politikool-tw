export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const origin = event.headers.origin || event.headers.referer || '';
  if (origin && !origin.includes('netlify.app') && !origin.includes('localhost')) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden origin' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing GEMINI_API_KEY' }) };
  }

  try {
    const body = JSON.parse(event.body);
    
    const payload = {
      ...body,
      generationConfig: {
        ...(body.generationConfig || {}),
        maxOutputTokens: 8192,
      }
    };

    const response = await fetch(
      `https://googleapis.com{apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
