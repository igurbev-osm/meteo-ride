export const mapInit = {
    center: [42.75, 24.68],
    zoom: 8    
};

export const mapTiles = {
    opentopo: {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        maxZoom: 17,
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
               '<a href="https://opentopomap.org/">OpenTopoMap</a> (CC-BY-SA)'
    },
    bgMountains:  {
        url: "https://bgmtile.kade.si/{z}/{x}/{y}.png",
        maxZoom: 17,
        attribution: 'Map data: &copy; <a href="https://kade.si/">BgMountains</a> contributors, ' +
               '<a href="https://kade.si/">BgMountains</a> (CC-BY-SA)'
    },
    osm:  {
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        maxZoom: 17,
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
               '<a href="https://www.openstreetmap.org/">OpenStreetMap</a> (CC-BY-SA)'
    }
};

export const trackListUrl = "tracks-list.json";

export const trackConf = {
    weight: 6,
    opacity: 0.85,
    showAtZoom: 8,
    colors:  ['#FF0000','#03fcfc','#fca503','#03fc5e','#034efc', '#aa0e6eff']
};