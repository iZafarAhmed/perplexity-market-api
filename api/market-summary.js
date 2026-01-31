export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { country = 'US', ...queryParams } = req.query;
    
    // Construct the URL with query parameters
    const baseUrl = 'https://www.perplexity.ai/rest/finance/market-summary/market?country=US';
    const url = new URL(baseUrl);
    url.searchParams.append('country', country);
    
    // Add any additional query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // Make request to Perplexity API
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Perplexity API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Set cache headers (cache for 1 hour)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    return res.status(200).json({
      success: true,
      data: data,
      meta: {
        source: 'Perplexity Finance API',
        country: country,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching market summary:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch market data'
    });
  }
}
