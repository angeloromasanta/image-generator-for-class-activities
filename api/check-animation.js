// Create a new file: pages/api/check-animation.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Missing animation ID' });
  }

  try {
    const response = await fetch(`https://api.dev.runwayml.com/v1/image_to_video/${id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.RUNWAYML_API_SECRET}`,
        'X-Runway-Version': '2024-11-06'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Runway API Error:', error);
      return res.status(response.status).json(error);
    }

    const result = await response.json();

    if (result.status === 'SUCCEEDED' && result.output?.[0]) {
      // Download the video from Runway
      const videoResponse = await fetch(result.output[0]);
      if (!videoResponse.ok) {
        throw new Error('Failed to download video from Runway');
      }
      
      const videoBuffer = await videoResponse.arrayBuffer();

      return res.status(200).json({
        status: 'success',
        videoData: Buffer.from(videoBuffer).toString('base64'),
        contentType: 'video/mp4'
      });
    } else if (result.status === 'FAILED') {
      return res.status(200).json({ status: 'failed' });
    } else {
      return res.status(200).json({ status: 'processing' });
    }
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      message: 'Error checking animation status', 
      error: error.message 
    });
  }
}