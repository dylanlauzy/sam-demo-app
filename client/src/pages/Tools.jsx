import { useState, useRef, useEffect } from "react";
import axios from "axios";

const Tools = ({ image, setImage, filename }) => {
  const [selectedTool, setSelectedTool] = useState("rectangle"); // 'text', 'rectangle', or 'point'
  const [drawing, setDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [rect, setRect] = useState(null);
  const [positivePoints, setPositivePoints] = useState([]);
  const [negativePoints, setNegativePoints] = useState([]);
  const [textPrompt, setTextPrompt] = useState("");
  const [scaleFactor, setScaleFactor] = useState(1); // Add this state variable


  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = image;
    img.onload = () => {
        const containerWidth = canvas.parentElement.offsetWidth;
        const containerHeight = canvas.parentElement.offsetHeight;
    
        const newSize = fitToContainer(img.width, img.height, containerWidth, containerHeight);
        
        canvas.width = newSize.width;
        canvas.height = newSize.height;
    
        const scale = newSize.width / img.width; // Calculate scale factor
        setScaleFactor(scale); // Set the scale factor
    
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [image]);

  useEffect(() => {
    drawImageAndAnnotations();
  }, [rect, positivePoints, negativePoints]);

  const handleMouseDown = (e) => {
    if (selectedTool !== 'rectangle') return;
    setDrawing(true);
    setStartX(e.nativeEvent.offsetX / scaleFactor);
    setStartY(e.nativeEvent.offsetY / scaleFactor);
};

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const x = e.nativeEvent.offsetX / scaleFactor;  // Corrected from 'ofsfsetX' to 'offsetX'
    const y = e.nativeEvent.offsetY / scaleFactor;

    setRect({
      x: startX,
      y: startY,
      width: x - startX,
      height: y - startY
    });
  };

  const handleMouseUp = () => {
    if (selectedTool !== 'rectangle') return;
    setDrawing(false);
  };

  const handleMouseClick = (e) => {
    if (selectedTool !== 'point') return;
    const x = e.nativeEvent.offsetX / scaleFactor;
    const y = e.nativeEvent.offsetY / scaleFactor;
    const point = [x, y];
    
    // Check if it is a right click or a left click
    if (e.button === 0) { // Left Click
      setPositivePoints(prev => [...prev, point]);
    } else if (e.button === 2) { // Right Click
      setNegativePoints(prev => [...prev, point]);
    }
  };

  const drawImageAndAnnotations = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = image;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (rect) {
          console.log(rect)
          ctx.strokeStyle = 'red';
          ctx.strokeRect(rect.x * scaleFactor, rect.y * scaleFactor, rect.width * scaleFactor, rect.height * scaleFactor);
        }
        
        // Draw positive points
        ctx.fillStyle = 'green';
        positivePoints.forEach(point => {
          ctx.beginPath();
          ctx.arc(point[0] * scaleFactor, point[1] * scaleFactor, 5, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Draw negative points
        ctx.fillStyle = 'red';
        negativePoints.forEach(point => {
          ctx.beginPath();
          ctx.arc(point[0] * scaleFactor, point[1] * scaleFactor, 5, 0, 2 * Math.PI);
          ctx.fill();
        });
    };
  };

  const fitToContainer = (imgWidth, imgHeight, containerWidth, containerHeight) => {
    const imgAspect = imgWidth / imgHeight;
    const containerAspect = containerWidth / containerHeight;

    let newWidth, newHeight;

    if (imgAspect > containerAspect) {
        // constrained by width
        newWidth = containerWidth;
        newHeight = newWidth / imgAspect;
    } else {
        // constrained by height
        newHeight = containerHeight;
        newWidth = newHeight * imgAspect;
    }

    return { width: newWidth, height: newHeight };
  };

  const handlePromptSubmit = async () => {
    let response = null;

    if (selectedTool === "text") {
      response = await textPromptSubmit();
    } else {
      response = await boxPointPromptSubmit();
    }

    const imageUrl = URL.createObjectURL(response.data);
    setImage(imageUrl);  // Use the passed function to update the image URL
  }

  const textPromptSubmit = async () => {
    const data = {
      filename: filename,
      text: textPrompt
    };

    try {
      const response = await axios.post("http://localhost:5000/prompt", data, { responseType: 'blob' });
      return response;
    } catch (error) {
      console.error('Error with prompting:', error);
    }
  }

  const boxPointPromptSubmit = async () => {
    let x1, x2, y1, y2
    if (rect) {
      x1 = Math.min(rect.x, rect.x + rect.width)
      x2 = Math.max(rect.x, rect.x + rect.width)
      y1 = Math.min(rect.y, rect.y + rect.height)
      y2 = Math.max(rect.y, rect.y + rect.height)
    }

    const data = {
      filename: filename,
      box: rect ? [x1, y1, x2, y2] : null, 
      points: {
        positive: positivePoints,
        negative: negativePoints
      }
    };

    try {
      const response = await axios.post("http://localhost:5000/box-prompt", data, { responseType: 'blob' });
      return response
    } catch (error) {
      console.error('Error with prompting:', error);
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md h-screen w-screen flex">
      {/* Toolbar on the left */}
      <div className="flex flex-col space-y-4 mr-8 min-w-[15rem]">
        <h1 className="text-xl font-bold">FastDYLAN</h1>
        
        {/* Buttons stacked vertically */}
        <button onClick={() => setSelectedTool('rectangle')} className={`p-2 rounded-md ${selectedTool === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Rectangle</button>
        <button onClick={() => setSelectedTool('point')} className={`p-2 rounded-md ${selectedTool === 'point' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Point</button>

        {selectedTool === "point" && (
          <button
            className={`p-2 rounded-md ${selectedTool === 'point' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          />
        )}  


        <button onClick={() => setSelectedTool('text')} className={`p-2 rounded-md ${selectedTool === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>Text Prompt</button>
        
        {selectedTool === 'text' && (
          <input
            type="text"
            placeholder="Enter prompt..."
            className="mt-1 block p-2 border rounded-md w-full"
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
          />
        )}
        
        <button
          className="w-full mt-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 justify-self-end"
          onClick={handlePromptSubmit}
        >
          Generate Mask
        </button>
      </div>
      
      {/* Image Canvas on the right */}
      <div className="border rounded-md p-2 flex-1 relative w-full h-full overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}  // Adjust dimensions as needed
          height={600}
          onClick={handleMouseClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        />
      </div>
    </div>
  );
}

export default Tools