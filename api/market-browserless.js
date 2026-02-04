export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { country = 'US' } = req.query;
  
  try {
    // Use Browserless.io (free tier available)
    const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || 'YOUR_BROWSERLESS_KEY';
    const url = `https://www.perplexity.ai/rest/finance/market-summary/market?country=${country}`;
    
    console.log('Using Browserless to fetch data...');
    
    const browserlessResponse = await fetch('https://chrome.browserless.io/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...(BROWSERLESS_API_KEY && { 'Authorization': `Bearer ${BROWSERLESS_API_KEY}` })
      },
      body: JSON.stringify({
        url: url,
        elements: [{ selector: 'body' }],
        gotoOptions: {
          waitUntil: 'networkidle0',
          timeout: 30000
        },
        setExtraHTTPHeaders: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.perplexity.ai/'
        }
      })
    });

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error('Browserless error:', errorText);
      throw new Error(`Browserless failed: ${browserlessResponse.status}`);
    }

    const result = await browserlessResponse.json();
    
    try {
      // Try to parse JSON from the page content
      const bodyText = result.data[0]?.results[0]?.text || result.data[0]?.text || '{}';
      const data = JSON.parse(bodyText);
      
      return res.status(200).json({
        success: true,
        data: data,
        meta: {
          source: 'Perplexity via Browserless',
          method: 'Headless browser',
          country: country,
          timestamp: new Date().toISOString(),
          data_created: data.created,
          fresh: true
        }
      });
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // Fallback to mock data
      return getFallbackData(res, country);
    }

  } catch (error) {
    console.error('Browserless error:', error);
    return getFallbackData(res, country);
  }
}

function getFallbackData(res, country) {
  // Return mock/stale data as fallback
  const mockData = {
    created: new Date().toISOString(),
    market_summary: {
      indices: [
        {
          symbol: "^GSPC",
          name: "S&P 500",
          price: Math.random() * 100 + 4700,
          change: (Math.random() - 0.5) * 50,
          change_percent: (Math.random() - 0.5) * 2,
          updated: new Date().toISOString()
        },
        {
          symbol: "^DJI",
          name: "Dow Jones Industrial Average",
          price: Math.random() * 1000 + 37000,
          change: (Math.random() - 0.5) * 100,
          change_percent: (Math.random() - 0.5) * 1.5,
          updated: new Date().toISOString()
        }
      ]
    }
  };
  
  return res.status(200).json({
    success: true,
    data: mockData,
    meta: {
      source: 'Mock Data',
      note: 'Perplexity API blocked, showing simulated data',
      country: country,
      timestamp: new Date().toISOString()
    }
  });
}
