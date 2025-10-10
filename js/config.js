export const mapInit = {
    center: [42.7, 23.3],
    zoom: 8,
    
    
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