import React, { useState } from 'react';
import { CButton, CCard, CCardBody, CCardHeader, CSpinner, CBadge } from '@coreui/react';

function Geolocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getLocation = async () => {
    setLoading(true);
    setError('');
    setLocation(null);

    try {
      // Step 1: Get coordinates directly from system
      const coords = await window.electronAPI.getSystemLocation();
      
      // Step 2: Verify coordinates
      if (!coords.latitude || !coords.longitude) {
        throw new Error('Invalid coordinates received');
      }

      // Step 3: Get address data
      const addressData = await window.electronAPI.getAddressData(
        coords.latitude,
        coords.longitude
      );

      if (addressData.error) throw new Error(addressData.error);

      setLocation({
        coords: {
          lat: coords.latitude,
          lon: coords.longitude
        },
        address: addressData.address,
        displayName: addressData.display_name
      });

    } catch (err) {
      handleLocationError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationError = (err) => {
    const errorMap = {
      1: 'Permission denied - Enable in system settings',
      2: 'Position unavailable - Check location services',
      3: 'Timeout - Ensure location services are active',
      default: 'Location detection failed'
    };
    
    setError(errorMap[err.code] || errorMap.default);
    console.error('Location Error:', err);
  };

  return (
    <CCard className="mb-4">
      <CCardHeader><h5>Location Finder</h5></CCardHeader>
      <CCardBody>
        <div className="d-flex flex-column gap-3">
          <CButton 
            color="primary" 
            onClick={getLocation}
            disabled={loading}
          >
            {loading ? <><CSpinner size="sm" /> Locating...</> : 'Find My Location'}
          </CButton>

          {error && <CBadge color="danger">{error}</CBadge>}

          {location && (
            <div className="mt-3">
              <div className="mb-2">
                <strong>Coordinates:</strong><br />
                {location.coords.lat.toFixed(4)}, {location.coords.lon.toFixed(4)}
              </div>
              
              <div className="mb-2">
                <strong>Address:</strong>
                <div className="ms-2">
                  {location.address?.road && <div>{location.address.road}</div>}
                  {location.address?.city && <div>{location.address.city}</div>}
                  {location.address?.postcode && <div>{location.address.postcode}</div>}
                  {location.address?.country && <div>{location.address.country}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </CCardBody>
    </CCard>
  );
}

export default Geolocation;