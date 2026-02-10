import FingerprintJS from '@fingerprintjs/fingerprintjs';

class DeviceService {
  constructor() {
    this.deviceId = null;
    this.fpPromise = null;
  }

  // Initialize fingerprinting (call this early in app)
  async init() {
    try {
      if (!this.fpPromise) {
        this.fpPromise = FingerprintJS.load();
      }
      
      const fp = await this.fpPromise;
      const result = await fp.get();
      
      // This is the unique device fingerprint
      this.deviceId = result.visitorId;
      
      // Store in localStorage as backup
      localStorage.setItem('deviceFingerprint', this.deviceId);
      
      console.log('📱 Device Fingerprint Initialized:', {
        id: this.deviceId.substring(0, 20) + '...',
        confidence: result.confidence.score,
        components: Object.keys(result.components)
      });
      
      return this.deviceId;
    } catch (error) {
      console.error('❌ FingerprintJS Error:', error);
      // Fallback to simpler method
      return this.getFallbackDeviceId();
    }
  }

  // Get device ID (will initialize if not done)
  async getDeviceId() {
    if (this.deviceId) {
      return this.deviceId;
    }
    
    // Check localStorage
    const storedId = localStorage.getItem('deviceFingerprint');
    if (storedId) {
      this.deviceId = storedId;
      return storedId;
    }
    
    // Initialize
    return await this.init();
  }

  // Simple fallback if FingerprintJS fails
  getFallbackDeviceId() {
    try {
      // Create a simple but stable fingerprint
      const fingerprintData = [
        navigator.userAgent,
        navigator.language,
        navigator.platform,
        screen.width,
        screen.height,
        screen.colorDepth,
        navigator.hardwareConcurrency || 'unknown',
        Intl.DateTimeFormat().resolvedOptions().timeZone
      ].join('|');
      
      // Simple hash
      let hash = 0;
      for (let i = 0; i < fingerprintData.length; i++) {
        hash = ((hash << 5) - hash) + fingerprintData.charCodeAt(i);
        hash = hash & hash;
      }
      
      this.deviceId = 'fallback_' + Math.abs(hash).toString(36);
      localStorage.setItem('deviceFingerprint', this.deviceId);
      
      return this.deviceId;
    } catch (error) {
      // Last resort
      const lastResortId = 'last_resort_' + Date.now().toString(36);
      this.deviceId = lastResortId;
      localStorage.setItem('deviceFingerprint', lastResortId);
      return lastResortId;
    }
  }

  // Check if provided ID matches current device
  async verifyDevice(storedDeviceId) {
    const currentId = await this.getDeviceId();
    return storedDeviceId === currentId;
  }

  // Get current ID without async (if already initialized)
  getCurrentDeviceId() {
    return this.deviceId || localStorage.getItem('deviceFingerprint');
  }

  // Reset device ID (for logout/testing)
  reset() {
    this.deviceId = null;
    localStorage.removeItem('deviceFingerprint');
    this.fpPromise = null;
  }
}

// Create singleton instance
const deviceService = new DeviceService();

// Initialize early (but don't block app start)
deviceService.init().catch(console.error);

export default deviceService;