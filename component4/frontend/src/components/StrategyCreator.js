import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

const StrategyCreator = () => {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [strategyName, setStrategyName] = useState('');
  const [parameters, setParameters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isCustom, setIsCustom] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Dropzone setup for file uploads
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/x-c++src': ['.cpp', '.h'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      setUploadedFile(acceptedFiles[0]);
    }
  });
  
  useEffect(() => {
    // In a real app, fetch this from API
    // For demo, use mock data
    setTimeout(() => {
      const mockTemplates = {
        "moving_average_crossover": {
          "name": "Moving Average Crossover",
          "description": "Strategy that trades based on the crossover of two moving averages",
          "parameters": {
            "short_period": "Short moving average period",
            "long_period": "Long moving average period"
          }
        },
        "rsi": {
          "name": "Relative Strength Index",
          "description": "Strategy that trades based on RSI overbought/oversold levels",
          "parameters": {
            "period": "RSI calculation period",
            "oversold": "Oversold threshold (usually 30)",
            "overbought": "Overbought threshold (usually 70)"
          }
        }
      };
      
      setTemplates(mockTemplates);
      setIsLoading(false);
    }, 500);
  }, []);
  
  const handleTemplateChange = (e) => {
    const template = e.target.value;
    setSelectedTemplate(template);
    
    // Reset parameters when template changes
    if (template && templates[template]) {
      const defaultParams = {};
      Object.keys(templates[template].parameters).forEach(key => {
        defaultParams[key] = '';
      });
      setParameters(defaultParams);
    } else {
      setParameters({});
    }
  };
  
  const handleParameterChange = (key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!strategyName.trim()) {
      setMessage({ text: 'Please enter a strategy name', type: 'error' });
      return;
    }
    
    if (isCustom) {
      if (!uploadedFile) {
        setMessage({ text: 'Please upload a strategy file', type: 'error' });
        return;
      }
      
      // In a real app, implement file upload to API
      setIsLoading(true);
      
      setTimeout(() => {
        setMessage({ text: 'Custom strategy uploaded successfully!', type: 'success' });
        setIsLoading(false);
        
        // Reset form
        setStrategyName('');
        setUploadedFile(null);
      }, 1000);
      
    } else {
      if (!selectedTemplate) {
        setMessage({ text: 'Please select a strategy template', type: 'error' });
        return;
      }
      
      // Validate parameters
      const requiredParams = Object.keys(templates[selectedTemplate].parameters);
      for (const param of requiredParams) {
        if (!parameters[param] || parameters[param].trim() === '') {
          setMessage({ text: `Please fill in ${param}`, type: 'error' });
          return;
        }
      }
      
      // In a real app, send to API
      setIsLoading(true);
      
      setTimeout(() => {
        setMessage({ text: 'Strategy created successfully!', type: 'success' });
        setIsLoading(false);
        
        // Reset form
        setStrategyName('');
        setSelectedTemplate('');
        setParameters({});
      }, 1000);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Create Trading Strategy</h1>
      
      {message.text && (
        <div className={`p-4 rounded mb-6 ${message.type === 'success' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
          {message.text}
        </div>
      )}
      
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsCustom(false)} 
              className={`px-4 py-2 rounded-lg ${!isCustom ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Use Template
            </button>
            <button 
              onClick={() => setIsCustom(true)} 
              className={`px-4 py-2 rounded-lg ${isCustom ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Upload Custom
            </button>
          </div>
        </div>
      
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="strategy-name" className="block text-sm font-medium text-gray-300 mb-2">Strategy Name</label>
            <input 
              type="text" 
              id="strategy-name"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
              placeholder="Enter strategy name"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              required
            />
          </div>
          
          {isCustom ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Upload Strategy File</label>
              <div 
                {...getRootProps()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-6 cursor-pointer hover:border-green-500 transition-colors"
              >
                <input {...getInputProps()} />
                {uploadedFile ? (
                  <div className="text-center">
                    <p className="text-green-400">File uploaded: {uploadedFile.name}</p>
                    <p className="text-gray-400 text-sm">({uploadedFile.size} bytes)</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-400">Drag and drop your strategy file here, or click to select</p>
                    <p className="text-gray-500 text-sm mt-1">(.cpp, .h, .txt files supported)</p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Your uploaded strategy must conform to the required interface for plug-and-play functionality.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label htmlFor="strategy-template" className="block text-sm font-medium text-gray-300 mb-2">Strategy Template</label>
                <select 
                  id="strategy-template"
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  disabled={isLoading}
                  required
                >
                  <option value="">Select a template</option>
                  {Object.entries(templates).map(([key, template]) => (
                    <option key={key} value={key}>{template.name}</option>
                  ))}
                </select>
              </div>
              
              {selectedTemplate && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-200 mb-2">Parameters</h3>
                  <p className="text-gray-400 mb-4">{templates[selectedTemplate].description}</p>
                  
                  <div className="space-y-4">
                    {Object.entries(templates[selectedTemplate].parameters).map(([key, description]) => (
                      <div key={key}>
                        <label htmlFor={key} className="block text-sm font-medium text-gray-300 mb-1">
                          {description}
                        </label>
                        <input 
                          type="text" 
                          id={key}
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
                          placeholder={`Enter ${description.toLowerCase()}`}
                          value={parameters[key] || ''}
                          onChange={(e) => handleParameterChange(key, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="mt-8">
            <button 
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Create Strategy'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StrategyCreator;
