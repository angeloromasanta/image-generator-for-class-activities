// pages/api/animate.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    const { promptImage, promptText, headlineId } = req.body;
  
    if (!promptImage || !promptText || !headlineId) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
  
    try {
      // Initial request to Runway API
      const response = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.RUNWAYML_API_SECRET,
          'X-Runway-Version': '2024-11-06'
        },
        body: JSON.stringify({
          promptImage,
          promptText,
          model: 'gen3a_turbo'
        })
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
        
        // Get the video data as an ArrayBuffer
        const videoBuffer = await videoResponse.arrayBuffer();
  
        return res.status(200).json({
          status: 'success',
          videoData: Buffer.from(videoBuffer).toString('base64'),
          contentType: 'video/mp4'
        });
      } else {
        return res.status(202).json({
          status: 'processing',
          id: result.id
        });
      }
    } catch (error) {
      console.error('Server Error:', error);
      return res.status(500).json({ 
        message: 'Error processing animation request', 
        error: error.message 
      });
    }
  }