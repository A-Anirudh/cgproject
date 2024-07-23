import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [objectLinks, setObjectLinks] = useState({});
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Upload Image for Object Detection</h1>
      <form className="upload-form" onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} className="file-input" />
        <button type="submit" className="upload-button" disabled={!selectedFile || loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {preview && (
        <div className="preview-container">
          <h2 className="preview-title">Image Preview</h2>
          <img className="preview-image" src={preview} alt="Preview" />
        </div>
      )}
      <div className="object-links">
        {Object.keys(objectLinks).map((obj, index) => (
          <div key={index} className="object-item">
            <p>
              {obj}: <a href={objectLinks[obj]} target="_blank" rel="noopener noreferrer" className="amazon-link">Buy on Amazon</a>
            </p>
          </div>
        ))}
      </div>
      {image && (
        <div className="result-container">
          <h2 className="result-title">Detected Objects</h2>
          <img className="detected-image" src={image} alt="Detected objects" />
        </div>
      )}
    </div>
  );
}

export default App;
