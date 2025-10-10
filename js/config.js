export const mapInit = {
    center: [42.13, 24.93],
    zoom: 9    
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
    }
};

export const trackListUrl = "tracks-list.json";

export const trackConf = {
    weight: 6,
    opacity: 0.85,
    showAtZoom: 9
};