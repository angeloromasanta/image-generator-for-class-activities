// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import SubmitView from './views/SubmitView';
import AudienceGalleryView from './views/AudienceGalleryView';
import GalleryView from './views/GalleryView';
import './styles.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SubmitView />} />
      <Route path="/view" element={<AudienceGalleryView />} />
      <Route path="/gallery" element={<GalleryView />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
