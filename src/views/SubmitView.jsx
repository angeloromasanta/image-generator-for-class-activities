
// SubmitView.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Model configurations
const MODELS = {
  imagen: {
    id: 'google/imagen-3-fast',
    config: {
      size: "1365x1024"
    }
  },
  flux: {
    id: 'black-forest-labs/flux-1.1-pro',
    config: {
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 80,
      safety_tolerance: 2,
      prompt_upsampling: true
    }
  }
};

function SubmitView() {
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Currently using Flux model
  const selectedModel = MODELS.flux;

  const convertImageUrlToBase64 = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();

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
      
      // Generate image using API with model configuration
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          input: {
            ...selectedModel.config,
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
        const base64Image = await convertImageUrlToBase64(data.output);

        await addDoc(collection(db, 'headlines'), {
          headline,
          imageData: base64Image,
          timestamp: Timestamp.now()
        });

        setHeadline('');
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