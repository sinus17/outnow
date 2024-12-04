import { Handler } from '@netlify/functions';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: 'apify_api_IJtIeRDqKdEP0UsHIQVBlPnfH8y78V322E8Y',
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { videoUrl } = JSON.parse(event.body || '{}');

    if (!videoUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Video URL is required' })
      };
    }

    // Run the Actor and wait for it to finish
    const run = await client.actor("nCNiU9QG1e0nMwgWj").call({
      region: "DE",
      urls: [videoUrl],
      limit: 1,
      isUnlimited: false,
      publishTime: "ALL_TIME",
      proxyConfiguration: {
        useApifyProxy: true
      }
    });

    // Fetch results from the Actor's default dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(items)
    };
  } catch (error) {
    console.error('Apify proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch video data',
        details: error instanceof Error ? error.stack : undefined
      })
    };
  }
};