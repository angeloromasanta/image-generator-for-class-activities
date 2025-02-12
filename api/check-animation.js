// pages/api/check-animation.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Missing animation ID' });
  }

  try {
    const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.RUNWAYML_API_SECRET}`,
        'X-Runway-Version': '2024-11-06'
      }
    });

    if (!statusResponse.ok) {
      const error = await statusResponse.json();
      console.error('Runway API Error:', error);
      return res.status(statusResponse.status).json(error);
    }

    const taskResult = await statusResponse.json();

    if (taskResult.status === 'SUCCEEDED' && taskResult.output?.[0]) {
      // Download the video from the output URL
      const videoResponse = await fetch(taskResult.output[0]);
      if (!videoResponse.ok) {
        throw new Error('Failed to download video from Runway');
      }
      
      const videoBuffer = await videoResponse.arrayBuffer();

      return res.status(200).json({
        status: 'success',
        videoData: Buffer.from(videoBuffer).toString('base64'),
        contentType: 'video/mp4'
      });
    } else if (taskResult.status === 'FAILED') {
      return res.status(200).json({ status: 'failed' });
    } else if (taskResult.status === 'PENDING' || taskResult.status === 'RUNNING') {
      // Still processing
      return res.status(200).json({ status: 'processing' });
    } else {
      // Unknown status
      return res.status(200).json({ 
        status: 'failed',
        message: `Unexpected status: ${taskResult.status}`
      });
    }
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      message: 'Error checking animation status', 
      error: error.message 
    });
  }
}