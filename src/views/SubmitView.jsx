import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

function SubmitView() {
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const convertImageUrlToBase64 = async (imageUrl) => {
    try {
      // Fetch the image from the temporary URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      // Get the image as a blob
      const blob = await response.blob();

      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to convert image to base64: ' + error.message);
    }
  };

  const generateAndStoreImage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const enhancedPrompt = `Generate a vivid, realistic image depicting this future scenario: "${headline}". Make it detailed and imaginative, focusing on the key elements of the scene.`;
      
      // Generate image using API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            size: "1365x1024",
            prompt: enhancedPrompt
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate image');
      }

      const data = await response.json();

      if (data.output && typeof data.output === 'string') {
        // Convert the temporary URL to base64
        const base64Image = await convertImageUrlToBase64(data.output);

        // Store the base64 string in Firestore
        await addDoc(collection(db, 'headlines'), {
          headline,
          imageData: base64Image, // Store base64 string instead of URL
          timestamp: Timestamp.now()
        });

        setHeadline('');
        navigate('/gallery');
      } else {
        throw new Error('No image URL in response');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-container">
      <main className="submit-form">
        <div className="input-group">
          <label>What headline do you see in the future?</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g., 'First Human Colony on Mars Celebrates 10 Years'"
          />
        </div>

        <button
          onClick={generateAndStoreImage}
          disabled={loading || !headline}
          className="submit-button"
        >
          {loading ? 'Generating...' : 'Generate Vision'}
        </button>

        {error && <div className="error-message">Error: {error}</div>}
        {loading && <div className="loading-message">Visualizing the future...</div>}
      </main>
    </div>
  );
}

export default SubmitView;