export const intersects = (mapBounds, trackBounds) => !(
    mapBounds._northEast.lat < trackBounds._southWest.lat ||
    mapBounds._southWest.lat > trackBounds._northEast.lat || 
    mapBounds._northEast.lng < trackBounds._southWest.lng || 
    mapBounds._southWest.lng > trackBounds._northEast.lng);

export const bgBounds = L.latLngBounds(
    L.latLng(41.2, 22.0),  // SW
    L.latLng(44.3, 28.6)   // NE
  );

export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}


 // --- Haversine distance between two latlon pairs (meters). Careful arithmetic.
 const haversineDistance = (lat1, lon1, lat2, lon2) => {
   // convert degrees to radians
   const toRad = Math.PI / 180;
   const φ1 = lat1 * toRad;
   const φ2 = lat2 * toRad;
   const Δφ = (lat2 - lat1) * toRad;
   const Δλ = (lon2 - lon1) * toRad;
   const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
             Math.cos(φ1) * Math.cos(φ2) *
             Math.sin(Δλ/2) * Math.sin(Δλ/2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
   const R = 6371000; // Earth radius in meters
   return R * c;
 }

 
 export const computeStatsForCoords = (coords) => {
   // coords = [[lon,lat,ele?], ...]
   let dist = 0;
   let ascent = 0;
   for (let i = 1; i < coords.length; i++) {
     const [lon1, lat1, ele1] = coords[i-1];
     const [lon2, lat2, ele2] = coords[i];
     const seg = haversineDistance(lat1, lon1, lat2, lon2);
     dist += seg;
     if (typeof ele1 === 'number' && typeof ele2 === 'number') {
       const dE = ele2 - ele1;
       if (dE > 0) ascent += dE;
     }
   }
   return { distance_m: dist, ascent_m: ascent };
 }

 export const getStartPointFromGeoJSON = (geojson) => {
    if (!geojson || !geojson.features || geojson.features.length === 0) {
        return null;
    }

    const coords = geojson.features[0].geometry.coordinates;

    if (!coords || coords.length === 0) {
        return null;
    }

    const [lon, lat] = coords[0];   // GeoJSON = [longitude, latitude]

    return `${lat}, ${lon}`;
}
