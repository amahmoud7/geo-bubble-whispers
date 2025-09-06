export const mapStyles = [
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#333333" }]
  },
  {
    featureType: "administrative",
    elementType: "geometry.fill",
    stylers: [{ color: "#9b87f5" }, { visibility: "on" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#f6f7fb" }, { lightness: 10 }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#403E43" }]
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#f1f0fb" }, { lightness: 15 }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#E5DEFF" }, { lightness: 10 }]
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#d3e4fd" }, { lightness: 15 }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#f2fce2" }, { lightness: 10 }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0EA5E9" }, { opacity: 0.3 }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#fec6a1" }, { lightness: 20 }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#F2FCE2" }, { lightness: 10 }]
  }
];

export const defaultMapOptions = {
  styles: mapStyles,
  disableDefaultUI: true, // Disable all default controls
  zoomControl: false, // No zoom buttons
  mapTypeControl: false, // No map/satellite toggle
  streetViewControl: false, // No street view pegman
  fullscreenControl: false, // No fullscreen button
  scaleControl: false, // No scale indicator
  rotateControl: false, // No rotation control
  // Ensure map interaction is fully enabled for touch/mouse
  draggable: true,
  scrollwheel: true,
  disableDoubleClickZoom: false,
  keyboardShortcuts: true,
  gestureHandling: 'greedy', // Allow single-finger dragging on mobile
};
