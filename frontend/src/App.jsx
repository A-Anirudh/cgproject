import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [objectLinks, setObjectLinks] = useState({});
  const [image, setImage] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post('http://localhost:8000/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setObjectLinks(response.data.object_links);
      setImage(response.data.image_url);  // Set the URL for the annotated image
    } catch (error) {
      console.error('There was an error uploading the image!', error);
    }
  };

  return (
    <div>
      <h1>Upload Image for Object Detection</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
      <div>
        {Object.keys(objectLinks).map((obj, index) => (
          <div key={index}>
            <p>{obj}: <a href={objectLinks[obj]} target="_blank" rel="noopener noreferrer">Buy on Amazon</a></p>
          </div>
        ))}
      </div>
      {image && <img style={{ width: '600px', height:'600px' }}src={image} alt="Detected objects" />}
    </div>
  );
}

export default App;
