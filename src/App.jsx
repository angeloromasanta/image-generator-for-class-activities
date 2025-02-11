// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import SubmissionView from './components/SubmissionView'
import GalleryView from './components/GalleryView'
import './App.css'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SubmissionView db={db} />} />
        <Route path="/gallery" element={<GalleryView db={db} />} />
      </Routes>
    </Router>
  )
}

export default App