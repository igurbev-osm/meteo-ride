export const intersects = (mapBounds, trackBounds) => !(
    mapBounds._northEast.lat < trackBounds._southWest.lat ||
    mapBounds._southWest.lat > trackBounds._northEast.lat || 
    mapBounds._northEast.lng < trackBounds._southWest.lng || 
    mapBounds._southWest.lng > trackBounds._northEast.lng);
