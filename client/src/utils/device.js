// utils/deviceId.js
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  
  if (!deviceId) {
    // Generate a device ID that works across browsers
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    const userAgent = navigator.userAgent.substring(0, 5);
    
    deviceId = `device_${timestamp}_${random}_${userAgent}`;
    localStorage.setItem('deviceId', deviceId);
  }
  
  return deviceId;
};

// Optional: Add a function to reset device ID if needed
export const resetDeviceId = () => {
  localStorage.removeItem('deviceId');
  return getDeviceId(); // Generate new one
};

// Optional: Get a short display version
export const getShortDeviceId = () => {
  const id = getDeviceId();
  return id.substring(0, 12) + '...';
};