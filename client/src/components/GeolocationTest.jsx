import React, { useState } from 'react';
import { getUserLocation, isWithinCampus, getDistanceInMeters } from '../utils/geolocation';
import { FaMapMarkerAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

function GeolocationTest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const testGeolocation = async () => {
    setLoading(true);
    try {
      const location = await getUserLocation();
      const campusCheck = await isWithinCampus(location.latitude, location.longitude);
      
      const newResult = {
        timestamp: new Date().toLocaleTimeString(),
        location,
        campusCheck,
        distance: getDistanceInMeters(
          location.latitude, location.longitude,
          28.6139, 77.2090 // Default college coordinates
        )
      };
      
      setResult(newResult);
      setHistory(prev => [newResult, ...prev.slice(0, 4)]); // Keep last 5 results
      
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FaMapMarkerAlt className="text-blue-500" />
        Geolocation Test
      </h2>
      
      <button
        onClick={testGeolocation}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 mb-4"
      >
        {loading ? 'Getting Location...' : 'Test My Location'}
      </button>
      
      {result && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          {result.error ? (
            <p className="text-red-600">❌ {result.error}</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{result.timestamp}</span>
                {result.campusCheck.isWithin ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <FaCheckCircle /> Within Campus
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <FaTimesCircle /> Outside Campus
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-600">Latitude:</span>
                    <p className="font-mono">{result.location.latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Longitude:</span>
                    <p className="font-mono">{result.location.longitude.toFixed(6)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-600">Accuracy:</span>
                    <p>±{Math.round(result.location.accuracy)}m</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Distance:</span>
                    <p>{Math.round(result.distance)}m</p>
                  </div>
                </div>
                
                <div className="p-2 bg-blue-50 rounded">
                  <span className="text-gray-600">Status:</span>
                  <p className={result.campusCheck.isWithin ? 'text-green-700' : 'text-red-700'}>
                    {result.campusCheck.isWithin 
                      ? `✓ Within campus (${result.campusCheck.distance}m from center)`
                      : `✗ Outside campus (${result.campusCheck.distance}m away, limit: ${result.campusCheck.maxDistance}m)`
                    }
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {history.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Recent Tests</h3>
          <div className="space-y-2">
            {history.map((item, index) => (
              <div key={index} className="text-xs p-2 bg-gray-100 rounded">
                <div className="flex justify-between">
                  <span>{item.timestamp}</span>
                  <span className={item.campusCheck.isWithin ? 'text-green-600' : 'text-red-600'}>
                    {item.campusCheck.isWithin ? '✓' : '✗'} {Math.round(item.distance)}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>College coordinates: 28.6139, 77.2090 (Delhi)</p>
        <p>Campus radius: {process.env.REACT_APP_CAMPUS_RADIUS_M || 50} meters</p>
      </div>
    </div>
  );
}

export default GeolocationTest;