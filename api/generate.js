// api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { model, input } = req.body;
  
  if (!model || !model.id || !input) {
    return res.status(400).json({ message: 'Missing model configuration or input' });
  }

  try {
    // Initial request to start the prediction
    const response = await fetch(
      `https://api.replicate.com/v1/models/${model.id}/predictions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait'
        },
        body: JSON.stringify({ input })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Replicate API Error:', error);
      return res.status(response.status).json(error);
    }

    const prediction = await response.json();
    
    // Poll for the result if needed (when 'wait' header is not supported)
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!pollResponse.ok) {
        const error = await pollResponse.json();
        console.error('Polling Error:', error);
        return res.status(pollResponse.status).json(error);
      }
      
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      return res.status(400).json({ message: 'Image generation failed', error: result.error });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ message: 'Error generating image', error: error.message });
  }
}
