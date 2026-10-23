'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Star,
  RotateCcw,
  Navigation,
  ExternalLink,
  Store as StoreIcon,
  AlertCircle,
  Loader2,
  Compass,
} from 'lucide-react';
import { Store } from '../types';
import { getAssetUrl } from '../lib/api';

// Maharashtra geographic center and optimal zoom level to show entire state
const MAHARASHTRA_CENTER: [number, number] = [19.7515, 75.7139];
const MAHARASHTRA_DEFAULT_ZOOM = 7;

interface MaharashtraMapProps {
  stores: Store[];
  selectedStoreId?: string | null;
  onSelectStore?: (store: Store) => void;
  className?: string;
  onNearMeLocation?: (coords: { lat: number; lng: number }) => void;
}

export const MaharashtraMap: React.FC<MaharashtraMapProps> = ({
  stores,
  selectedStoreId,
  onSelectStore,
  className = '',
  onNearMeLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Filter stores that actually have valid, non-null coordinates
  const validStores = React.useMemo(() => {
    return stores.filter(
      (s) =>
        s.coordinates &&
        typeof s.coordinates.lat === 'number' &&
        typeof s.coordinates.lng === 'number' &&
        !isNaN(s.coordinates.lat) &&
        !isNaN(s.coordinates.lng) &&
        s.coordinates.lat >= -90 &&
        s.coordinates.lat <= 90 &&
        s.coordinates.lng >= -180 &&
        s.coordinates.lng <= 180
    );
  }, [stores]);

  const invalidCoordsCount = stores.length - validStores.length;

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    let isSubscribed = true;

    import('leaflet')
      .then((L) => {
        if (!isSubscribed || !mapContainerRef.current) return;

        try {
          const map = L.map(mapContainerRef.current, {
            center: MAHARASHTRA_CENTER,
            zoom: MAHARASHTRA_DEFAULT_ZOOM,
            minZoom: 5,
            maxZoom: 18,
            scrollWheelZoom: true,
            zoomControl: false, // We will position standard or custom zoom control cleanly
          });

          // Add Zoom control at top-right for comfortable ergonomics
          L.control.zoom({ position: 'topright' }).addTo(map);

          // Standard OpenStreetMap Tile Layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map);

          mapInstanceRef.current = map;
          setMapLoaded(true);
        } catch (err: any) {
          console.error('Failed to initialize Leaflet map:', err);
          setMapError('Unable to load map tiles. Please check your network connection.');
        }
      })
      .catch((err) => {
        console.error('Failed to import Leaflet:', err);
        setMapError('Map library failed to load.');
      });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers whenever validStores change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    import('leaflet').then((L) => {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      validStores.forEach((store) => {
        const { lat, lng } = store.coordinates!;
        const isSelected = store.id === selectedStoreId;

        // Custom HTML Marker Pin with Category color and Star Rating
        const ratingText = store.averageRating && store.averageRating > 0 ? store.averageRating.toFixed(1) : '★';
        const customIcon = L.divIcon({
          className: 'custom-store-pin',
          html: `
            <div class="relative group cursor-pointer flex flex-col items-center">
              <div class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold shadow-lg transition-transform duration-200 ${
                isSelected
                  ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-400/40 scale-125 z-30'
                  : 'bg-zinc-900 text-white hover:bg-amber-500 hover:text-zinc-950 border border-zinc-700 hover:border-amber-400 hover:scale-110 z-10'
              }">
                <span class="text-amber-400 group-hover:text-zinc-950 ${isSelected ? 'text-zinc-950' : ''}">★</span>
                <span>${ratingText}</span>
              </div>
              <div class="w-2 h-2 rotate-45 -mt-1 ${
                isSelected ? 'bg-amber-500' : 'bg-zinc-900 group-hover:bg-amber-500'
              }"></div>
            </div>
          `,
          iconSize: [46, 32],
          iconAnchor: [23, 30],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        // Rich Interactive Popup Content
        const coverSrc = getAssetUrl(store.coverImage);
        const popupContent = `
          <div class="w-64 max-w-xs overflow-hidden font-sans text-slate-800 dark:text-zinc-100">
            ${
              coverSrc
                ? `<div class="h-28 w-full overflow-hidden bg-slate-200 dark:bg-zinc-950">
                    <img src="${coverSrc}" alt="${store.name}" class="w-full h-full object-cover" onerror="this.style.display='none'" />
                   </div>`
                : `<div class="h-16 w-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    ${store.category || 'Store'}
                   </div>`
            }
            <div class="p-3.5 space-y-2">
              <div class="flex items-center justify-between gap-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                  ${store.category || 'Retail'}
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  ${store.city || 'Maharashtra'}
                </span>
              </div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1">
                ${store.name}
              </h4>
              <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">
                ${store.address}
              </p>
              <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800 text-xs">
                <span class="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  ★ ${store.averageRating > 0 ? store.averageRating.toFixed(1) : 'New'} 
                  <span class="text-slate-400 dark:text-zinc-500 font-normal">(${store.ratingCount || 0})</span>
                </span>
                <a 
                  href="/stores/${store.id}" 
                  class="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-400 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                >
                  View Store &rarr;
                </a>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 280,
          className: 'store-map-popup',
        });

        marker.on('click', () => {
          if (onSelectStore) {
            onSelectStore(store);
          }
        });

        marker.addTo(map);
        markersRef.current.set(store.id, marker);
      });
    });
  }, [validStores, selectedStoreId, onSelectStore, mapLoaded]);

  // Pan to selected store when selection changes
  useEffect(() => {
    if (!selectedStoreId || !mapInstanceRef.current || !mapLoaded) return;
    const targetStore = validStores.find((s) => s.id === selectedStoreId);
    if (targetStore && targetStore.coordinates) {
      const { lat, lng } = targetStore.coordinates;
      mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
      const marker = markersRef.current.get(selectedStoreId);
      if (marker) {
        setTimeout(() => marker.openPopup(), 400);
      }
    }
  }, [selectedStoreId, validStores, mapLoaded]);

  // Reset to Maharashtra View Handler
  const handleResetToMaharashtra = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(MAHARASHTRA_CENTER, MAHARASHTRA_DEFAULT_ZOOM, {
      duration: 1.2,
    });
    // Close any open popups
    mapInstanceRef.current.closePopup();
  }, []);

  // Near Me (Browser Geolocation) Handler
  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setUserCoords(coords);
        setGeoLocating(false);

        if (onNearMeLocation) {
          onNearMeLocation(coords);
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        import('leaflet').then((L) => {
          // Remove old user marker if present
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          // User Location Pin
          const userIcon = L.divIcon({
            className: 'user-location-pin',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="w-6 h-6 rounded-full bg-blue-500 ring-4 ring-blue-400/40 animate-pulse"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-white absolute"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const userMarker = L.marker([latitude, longitude], { icon: userIcon })
            .bindPopup(
              `<div class="p-2 text-xs font-semibold text-slate-800 dark:text-zinc-200">📍 You are here</div>`
            )
            .addTo(map);

          userMarkerRef.current = userMarker;
          map.flyTo([latitude, longitude], 12, { duration: 1.5 });
          setTimeout(() => userMarker.openPopup(), 800);
        });
      },
      (error) => {
        setGeoLocating(false);
        let msg = 'Could not retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. You can filter stores by Maharashtra cities manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        }
        alert(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [onNearMeLocation]);

  return (
    <div className={`relative w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 shadow-inner ${className}`}>
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" />

      {/* Loading Overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
            Loading Maharashtra Map & Store Locations...
          </p>
        </div>
      )}

      {/* Map Error State */}
      {mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-zinc-950">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1">Map Display Error</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mb-4">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors"
          >
            Reload Page
          </button>
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        {/* Reset to Maharashtra button */}
        <button
          type="button"
          id="btn-reset-maharashtra"
          onClick={handleResetToMaharashtra}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all backdrop-blur-sm"
          title="Reset map view to entire Maharashtra"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
          <span>Reset to Maharashtra</span>
        </button>

        {/* Near Me Location button */}
        <button
          type="button"
          id="btn-map-near-me"
          onClick={handleNearMe}
          disabled={geoLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/95 dark:bg-zinc-900/95 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all backdrop-blur-sm disabled:opacity-60"
          title="Find stores near your current device location"
        >
          {geoLocating ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
          )}
          <span>{geoLocating ? 'Locating...' : 'Near Me'}</span>
        </button>
      </div>

      {/* Bottom Info / Status Badge */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/95 dark:bg-zinc-900/95 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 shadow-md backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>
            <strong>{validStores.length}</strong> store markers in Maharashtra
          </span>
          {invalidCoordsCount > 0 && (
            <span className="text-[10px] text-slate-500 dark:text-zinc-400">
              ({invalidCoordsCount} without coordinates shown in list)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
