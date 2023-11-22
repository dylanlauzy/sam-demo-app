import './App.css';
import { useState } from 'react';

import Upload from './pages/Upload';
import Tools from './pages/Tools';

function App() {
  const [image, setImage] = useState(null);
  const [filename, setFilename] = useState("");
  const [view, setView] = useState('upload'); // Either 'upload' or 'tools'

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {view === 'upload' ? (
        <Upload setImage={setImage} setFilename={setFilename} transitionToTools={() => setView('tools')} />
      ) : (
        <Tools image={image} setImage={setImage} filename={filename}/>
      )}
    </div>
  );
}


export default App
