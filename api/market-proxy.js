export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { country = 'US' } = req.query;
  
  try {
    // Using AllOrigins proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      `https://www.perplexity.ai/rest/finance/market-summary/market?country=${country}`
    )}`;
    
    console.log('Using AllOrigins proxy...');
    
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Proxy returned ${response.status}`);
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      data: data,
      meta: {
        source: 'Perplexity via AllOrigins Proxy',
        proxy_used: 'allorigins.win',
        country: country,
        timestamp: new Date().toISOString(),
        data_created: data.created,
        fresh: !data.created || (Date.now() - new Date(data.created).getTime()) < 5 * 60 * 1000
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
