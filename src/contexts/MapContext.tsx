// Context to share Google Maps instance across components
// This allows any component to access the map for city detection and other features

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MapContextType {
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  return (
    <MapContext.Provider value={{ map, setMap }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};