import { mapInit, mapTiles, trackListUrl, trackConf } from './config.js';
import {intersects, bgBounds} from './utils.js';


const map = L.map('map').setView(mapInit.center, mapInit.zoom);

const mapLayer = mapTiles.osm;
L.tileLayer(mapLayer.url, 
  {
      maxZoom: mapLayer.maxZoom,
      attribution: mapLayer.attribution
}	).addTo(map); 

const openTopoMap = L.tileLayer(mapTiles.opentopo.url, 
  {
      maxZoom: mapTiles.opentopo.maxZoom,
      attribution: mapTiles.opentopo.attribution
}	);

const bgmMap = L.tileLayer(mapTiles.bgMountains.url, 
    {
        maxZoom: mapTiles.bgMountains.maxZoom,
        attribution: mapTiles.bgMountains.attribution
}	); 

readConfigFile();

let colorIdx = 0;
const tracks = []; // {id, title, layer, visible, color, stats}

function nextColor() { const c = trackConf.colors[colorIdx % trackConf.colors.length]; colorIdx++; return c; }

 function readConfigFile(){
     
         fetch(trackListUrl).then(response => {
             if (!response.ok) {
                 throw new Error("Network response was not ok");
             }
         return response.json(); 
         })
         .then(data => {
                         data.forEach(t => readGpxFile(t.gpx, t.name, t.url, t.start));   
             }).catch(error => {
                             console.error("Error fetching JSON:", error);
                         }
             );				
 }

  let locationMarker = null;
    let locationCircle = null;

    const checkbox = document.getElementById('showLocation');

    checkbox.addEventListener('change', function () {
      if (this.checked) {
        map.locate({ setView: true, watch: true, enableHighAccuracy: true });
        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);
      } else {
        map.stopLocate();
        map.off('locationfound', onLocationFound);
        map.off('locationerror', onLocationError);
        if (locationMarker) map.removeLayer(locationMarker);
        if (locationCircle) map.removeLayer(locationCircle);
      }
    });

    function onLocationFound(e) {
      if (locationMarker) map.removeLayer(locationMarker);
      if (locationCircle) map.removeLayer(locationCircle);

      locationMarker = L.marker(e.latlng).addTo(map);
      locationCircle = L.circle(e.latlng, { radius: e.accuracy / 2 }).addTo(map);
    }

    function onLocationError(e) {
      alert("Не може да се определи местоположението.");
      checkbox.checked = false;
    }

 function extractLineCoords(feature) {
   
   const geom = feature.geometry;
   const coords = [];
   if (!geom) return coords;
   if (geom.type === 'LineString') coords.push(geom.coordinates);
   else if (geom.type === 'MultiLineString') geom.coordinates.forEach(c => coords.push(c));
   else if (geom.type === 'GeometryCollection' && geom.geometries) {
     geom.geometries.forEach(g => {
       if (g.type === 'LineString') coords.push(g.coordinates);
       if (g.type === 'MultiLineString') g.coordinates.forEach(c=>coords.push(c));
     });
   }
   return coords;
 }

 // --- Haversine distance between two latlon pairs (meters). Careful arithmetic.
 function haversineDistance(lat1, lon1, lat2, lon2) {
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

 
 function computeStatsForCoords(coords) {
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

 
 function addGeoJSON(geojson, titleHint, url, startPoint) {
   
   const features = (geojson.type === 'FeatureCollection') ? geojson.features : [geojson];
   features.forEach((feat, idx) => {
     
     const lines = extractLineCoords(feat);
     if (lines.length === 0) {
     
       return;
     }

     const color = nextColor();   
      const group = L.featureGroup();
      lines.forEach(line => {
        const latlngs = line.map(c => [c[1], c[0]]); // [lat,lon]
        L.polyline(latlngs, { color, weight: trackConf.weight, opacity: trackConf.opacity }).addTo(group);
        
      });

     let totalDist = 0, totalAscent = 0;
     lines.forEach(line => {
       const s = computeStatsForCoords(line);
       totalDist += s.distance_m;
       totalAscent += s.ascent_m;
     });   
     const id = 't' + Date.now() + Math.round(Math.random()*10000);
     const track = { id, title: titleHint, url, layer: group, visible: true, color, stats: { distance_m: totalDist, ascent_m: totalAscent }, geojson: feat, startPoint: startPoint };
     tracks.push(track);     
     
     //try { const b = group.getBounds(); if (b.isValid()) map.fitBounds(b, { padding: [30,30] }); } catch(e){/*ignore*/}

   });
 }

const getZoom = _ => Math.round(map.getZoom()); 

 function displayValidTracks(){
    tracks.forEach(t => 
    {      
     const trackBounds = t.layer.getBounds();
     const mapBounds = map.getBounds();     
     if(intersects(mapBounds, trackBounds) && getZoom() >= trackConf.showAtZoom ){
        map.addLayer(t.layer);
        renderTrackListItem(t);
     }else{
        map.removeLayer(t.layer);
     }
    });
 }

 function formatNumber(n, digits) { return Number(n).toFixed(digits); }
 function metersToKm(m) { return m/1000; }

 let timer;

function debounce() {
  clearTimeout(timer)
  timer = setTimeout(() => {
     displayValidTracks();
     switchMap();
  }, 300);
}

 function readGpxFile(file, name, url, startPoint){
     try{
         fetch(file) 
         .then(res => res.text())
         .then(gpx => {
             const xml = new DOMParser().parseFromString(gpx, "application/xml");
     
             const geojson = toGeoJSON.gpx(xml);
             addGeoJSON(geojson, name, url, startPoint);
         })
         .then( _ => {
          displayValidTracks();
          map.on('zoomend', () => {
            debounce();            
          });
          map.on('dragend', () => {
            debounce();
          });
         });
     
     }catch(e){
         console.log("rendering file error: " + e);
     }
 }
 
 function renderTrackListItem(t) {   
     
   const statsText = `${formatNumber(metersToKm(t.stats.distance_m), 2)} km — +${Math.round(t.stats.ascent_m)} m`;
         
    
   const popupHtml = `
     <b>${t.title}</b><br>
     ${statsText}<br>
     <a href="${t.url}" target="_blank">Статия</a>   
    ` + (t.startPoint ? `<br><a href="https://www.google.com/maps/dir/?api=1&destination=${t.startPoint}" target="_blank">Стартова точка</a>` : "");



    let popup;
    t.layer.on("click", (е) => {
       map.fitBounds(t.layer.getBounds());                   
       popup = openPopup(e, popupHtml);
    });  
    t.layer.on("mouseover", (e) => {    
      if(getZoom() < 14){              
        popup = openPopup(e, popupHtml);
      }
   });    
    // t.layer.on("mouseout", () => { 
    //   setTimeout(() => {
    //     popup.closePopup();
    //  }, 1000);                       
    // });    
 }

 function openPopup(e, popupHtml){
  const popup = L.popup()
    .setLatLng(e.latlng) 
    .setContent(popupHtml)
    .openOn(map);  
    return popup;
 }

 function switchMap(){
  const center = map.getCenter();  
  if (getZoom() >= mapInit.mapSwitchZoom) {
      if(bgBounds.contains(center)){
        if (!map.hasLayer(bgmMap)) {
          map.addLayer(bgmMap);          
        };
        if (map.hasLayer(openTopoMap)) {
          map.removeLayer(openTopoMap)
        };
      }else{
        if (!map.hasLayer(openTopoMap)) {
          map.addLayer(openTopoMap);          
        };
        if (map.hasLayer(bgmMap)) {
          map.removeLayer(bgmMap)
        };
      }

    
  } else {
    if (map.hasLayer(bgmMap)) map.removeLayer(bgmMap);
    if (map.hasLayer(openTopoMap)) map.removeLayer(openTopoMap);
  }
 }