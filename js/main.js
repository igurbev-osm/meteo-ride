import { mapInit, mapTiles, trackListUrl, trackConf } from './config.js';
import {intersects, bgBounds, sleep, computeStatsForCoords, getStartPointFromGeoJSON} from './utils.js';


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

(async _ => await readConfigFile())();

let colorIdx = 0;
const tracks = []; // {id, title, layer, visible, color, stats}

const nextColor = (trackConf) => { const c = trackConf.colors[colorIdx % trackConf.colors.length]; colorIdx++; return c; }


async function readConfigFile() {
    try {
        const res = await fetch(trackListUrl);

        if (!res.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await res.json();
        
        const total = data.length;
        let current = 0;
        updateProgress(0, total);
 
        for (const t of data) {
            await readGpxFile(t.gpx, t.name, t.url, t.start);
            current++;
            updateProgress(current, total);
            await sleep(1); 
        }

    } catch (error) {
        console.error("Error fetching JSON:", error);
    }
}

let locationMarker = null;
let locationCircle = null;

const checkbox = document.getElementById('showLocation');

    checkbox.addEventListener('change', function () {
      if (this.checked) {
        map.locate({ setView: true, watch: mapInit.followLocation, enableHighAccuracy: true });
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
 
 
 function addGeoJSON(geojson, titleHint, url, startPoint) {
   
   const features = (geojson.type === 'FeatureCollection') ? geojson.features : [geojson];
   startPoint = startPoint || getStartPointFromGeoJSON(geojson);
   features.forEach((feat, idx) => {
     
     const lines = extractLineCoords(feat);
     if (lines.length === 0) {
     
       return;
     }

     const color = nextColor(trackConf);   
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

async function readGpxFile(file, name, url, startPoint) {
    try {
 
        const res = await fetch(file); 
        const gpx = await res.text(); 
        const xml = new DOMParser().parseFromString(gpx, "application/xml");        
        const geojson = toGeoJSON.gpx(xml);
        
        addGeoJSON(geojson, name, url, startPoint);        
        displayValidTracks();        
        map.on("zoomend", () => debounce());
        map.on("dragend", () => debounce());

    } catch (e) {
        console.error("rendering file error:", e);
    }
}
 
 function renderTrackListItem(t) {   
     
   const statsText = `${formatNumber(metersToKm(t.stats.distance_m), 2)} km — +${Math.round(t.stats.ascent_m)} m`;
         
    
   const popupHtml = `
     <b>${t.title}</b><br>
     ${statsText}<br>
    `  + (t.url ?  `<a href="${t.url}" target="_blank">Статия</a>` : "") 
     + (t.startPoint ? `<br><a href="https://www.google.com/maps/dir/?api=1&destination=${t.startPoint}" target="_blank">Стартова точка</a>` : "");



    let popup;
    t.layer.on("click", (е) => {
       map.fitBounds(t.layer.getBounds());                   
       popup = openPopup(e, popupHtml);
    });  
     t.layer.on("mouseover", (e) => {
         popup = openPopup(e, popupHtml);
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

 function updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);

    document.getElementById("map-loader").style.display = "flex";
    document.getElementById("loader-percent").innerText = percent + "%";

    if (percent >= 100) {
        setTimeout(() => {
            document.getElementById("map-loader").style.display = "none";
        }, 300);
    }
}
