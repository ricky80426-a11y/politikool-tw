export const handler = async (event) => {
    // 1. 只允許 POST 請求
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
  
    // 2. 網域防護：只允許你自己的 Netlify 網域呼叫（防止外部網站盜連消耗額度）
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
      
      // 強制加上字數上限保護，避免單次請求消耗過多 Token
      const payload = {
        ...body,
        generationConfig: {
          ...(body.generationConfig || {}),
          maxOutputTokens: 1500,
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
