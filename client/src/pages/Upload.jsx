import axios from 'axios';
import { useState } from 'react';

const Upload = ({ setImage, setFilename, transitionToTools }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.filename) {
        setFilename(response.data.filename)
        
        // Process the file after upload
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result);
          transitionToTools();
        };

        if (file) {
          reader.readAsDataURL(file);
        }
      }
    } catch (error) {
      console.error('Error uploading the file:', error);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-96 space-y-4">
      <h1 className="text-xl font-bold">Upload Image</h1>
      <input
        type="file"
        className="mt-1 block w-full"
        onChange={handleImageUpload}
      />
      {isLoading && <div className="mt-2">Uploading... <span className="loader"></span></div>}
    </div>
  );
}

export default Upload