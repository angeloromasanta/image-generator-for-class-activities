export default async function handler(req, res) {
  // Log incoming request details (helpful for debugging)
  console.log('Incoming request method:', req.method);
  console.log('Incoming request path:', req.url);

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: `Method ${req.method} not allowed. Only POST requests are supported.`
    });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ 
      message: 'Missing required parameter: id'
    });
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
      return res.status(statusResponse.status).json({
        message: 'Runway API error',
        error: error
      });
    }

    const taskResult = await statusResponse.json();
    console.log('Task result:', taskResult);  // Add logging for debugging

    switch(taskResult.status) {
      case 'SUCCEEDED':
        if (!taskResult.output?.[0]) {
          return res.status(200).json({ 
            status: 'failed',
            message: 'No output URL in successful response' 
          });
        }
        
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

      case 'FAILED':
        return res.status(200).json({ 
          status: 'failed',
          message: taskResult.error || 'Animation failed'
        });

      case 'PENDING':
      case 'RUNNING':
        return res.status(200).json({ status: 'processing' });

      default:
        return res.status(200).json({ 
          status: 'failed',
          message: `Unexpected status: ${taskResult.status}`
        });
    }
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      message: 'Error checking animation status', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}