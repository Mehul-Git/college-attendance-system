/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
export function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if user is within campus radius
 */
export async function isWithinCampus(userLat, userLon) {
  try {
    const collegeLat = parseFloat(process.env.REACT_APP_COLLEGE_LAT) || 28.6139;
    const collegeLon = parseFloat(process.env.REACT_APP_COLLEGE_LON) || 77.2090;
    const campusRadius =
      parseFloat(process.env.REACT_APP_CAMPUS_RADIUS_M) || 30; // ✅ CHANGED
    
    const distance = getDistanceInMeters(
      userLat,
      userLon,
      collegeLat,
      collegeLon
    );
    
    return {
      isWithin: distance <= campusRadius,
      distance: Math.round(distance),
      maxDistance: campusRadius
    };
  } catch (error) {
    console.error('Geolocation check failed:', error);
    return { isWithin: false, distance: null, maxDistance: null };
  }
}

/**
 * Get user's current location with permission
 */
export async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMessage = 'Location permission denied';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'Location permission denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'Failed to get your location.';
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0 // Don't use cached location
      }
    );
  });
}

/**
 * Watch user's location continuously
 */
export function watchLocation(onSuccess, onError, options = {}) {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation not supported'));
    return null;
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };

  return navigator.geolocation.watchPosition(onSuccess, onError, {
    ...defaultOptions,
    ...options
  });
}

/**
 * Check if location is required for a role
 */
export function isLocationRequired(role) {
  return ['student', 'teacher'].includes(role);
}

/**
 * Format distance for display
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} meters`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Get campus location from environment variables
 */
export function getCampusLocation() {
  return {
    lat: parseFloat(process.env.REACT_APP_COLLEGE_LAT) || 28.6139,
    lon: parseFloat(process.env.REACT_APP_COLLEGE_LON) || 77.2090,
    radius:
      parseFloat(process.env.REACT_APP_CAMPUS_RADIUS_M) || 30 // ✅ CHANGED
  };
}
