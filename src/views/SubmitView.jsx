import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const MODELS = {
  imagen: {
    id: 'google/imagen-3-fast',
    config: { size: "1365x1024" }
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
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const selectedModel = MODELS.flux;

  const generateAndStoreImage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const enhancedPrompt = `Generate a vivid, realistic image depicting this future scenario: "${headline}". Make it detailed and imaginative, focusing on the key elements of the scene.`;
      
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

      if (!data.output || typeof data.output !== 'string') {
        throw new Error('No image URL in response');
      }

      // Fetch the image from the API response URL
      const imageResponse = await fetch(data.output);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image from API');
      }
      
      // Get the blob directly
      const blob = await imageResponse.blob();
      
      // Create storage reference with .webp extension
      const filename = `headlines/${Date.now()}_${headline.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webp`;
      const storageRef = ref(storage, filename);
      
      // Upload the blob directly to Firebase Storage
      await uploadBytes(storageRef, blob, {
        contentType: 'image/webp'
      });
      
      // Get the download URL
      const imageUrl = await getDownloadURL(storageRef);

      // Store metadata in Firestore
      await addDoc(collection(db, 'headlines'), {
        headline,
        teamName,
        imageUrl,
        timestamp: Timestamp.now(),
        isAnimating: false
      });

      setHeadline('');
      setTeamName('');
      navigate('/view');
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

        <div className="input-group">
          <label>Team Name</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter your team name"
          />
        </div>

        <button
          onClick={generateAndStoreImage}
          disabled={loading || !headline || !teamName}
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