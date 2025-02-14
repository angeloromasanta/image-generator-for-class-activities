// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import SubmitView from './views/SubmitView';
import AudienceView from './views/AudienceView';
import AdminView from './views/AdminView';
import './styles.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SubmitView />} />
      <Route path="/view" element={<AudienceView />} />
      <Route path="/admin" element={<AdminView />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
