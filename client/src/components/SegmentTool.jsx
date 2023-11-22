import { useState } from "react"

const SegmentTool = () => {
  const [image, setImage] = useState(null);
  const [textPrompt, setTextPrompt] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-96 space-y-4">
        <h1 className="text-xl font-bold">Segmentation Tool</h1>
        
        <div>
          <label className="block text-sm font-medium">Upload Image</label>
          <input
            type="file"
            className="mt-1 block w-full"
            onChange={handleImageUpload}
          />
        </div>
        
        {image && (
          <img src={image} alt="Uploaded Preview" className="w-full h-48 object-contain border rounded-md" />
        )}
        
        <div>
          <label className="block text-sm font-medium">Text Prompt</label>
          <input
            type="text"
            placeholder="Enter prompt..."
            className="mt-1 block w-full p-2 border rounded-md"
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
          />
        </div>
        
        <button className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">
          Generate Mask
        </button>
      </div>
    </div>
  );
}

export default SegmentTool