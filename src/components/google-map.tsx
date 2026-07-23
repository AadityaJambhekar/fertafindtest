import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import {
  getGoogleMapId,
  useGoogleMaps,
  type GLatLngLiteral,
  type GMap,
  type GMapEventListener,
  type GMarker,
} from "@/lib/google-maps-loader";

export type { GoogleMapLoadState } from "@/lib/google-maps-loader";
import type { GoogleMapLoadState } from "@/lib/google-maps-loader";

export type GoogleMapMarker = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  onClick?: () => void;
};

type Coords = { lat: number; lng: number };

type GoogleMapProps = {
  center: Coords | null;
  zoom?: number;
  markers?: GoogleMapMarker[];
  draggableMarker?: Coords | null;
  onMarkerDragEnd?: (coords: Coords) => void;
  onMapClick?: (coords: Coords) => void;
  className?: string;
  height?: number | string;
  onLoadStateChange?: (state: GoogleMapLoadState) => void;
  emptyFallback?: ReactNode;
};

// Reusable Google map. Shared by the Analyze farm-location picker and the public
// supplier directory. Renders a graceful fallback (never throws) when the browser
// key is missing or the script fails to load.
export function GoogleMap({
  center,
  zoom = 12,
  markers = [],
  draggableMarker = null,
  onMarkerDragEnd,
  onMapClick,
  className,
  height = 288,
  onLoadStateChange,
  emptyFallback,
}: GoogleMapProps): ReactElement {
  const { state, api } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const dragMarkerRef = useRef<GMarker | null>(null);
  const staticMarkersRef = useRef<GMarker[]>([]);
  const clickListenerRef = useRef<GMapEventListener | null>(null);

  // Keep the latest callbacks without forcing a map re-init.
  const onMapClickRef = useRef(onMapClick);
  const onMarkerDragEndRef = useRef(onMarkerDragEnd);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onMarkerDragEndRef.current = onMarkerDragEnd;
  }, [onMapClick, onMarkerDragEnd]);

  useEffect(() => {
    onLoadStateChange?.(state);
  }, [state, onLoadStateChange]);

  // Initialise the map once the API is ready.
  useEffect(() => {
    if (state !== "ready" || !api || !containerRef.current || mapRef.current) return;
    const map = new api.Map(containerRef.current, {
      center: center ?? { lat: 20, lng: 0 },
      zoom: center ? zoom : 2,
      mapId: getGoogleMapId(),
      clickableIcons: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: "greedy",
    });
    mapRef.current = map;
    clickListenerRef.current = map.addListener("click", (event) => {
      const point = event.latLng;
      if (point && onMapClickRef.current) {
        onMapClickRef.current({ lat: point.lat(), lng: point.lng() });
      }
    });
    return () => {
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
      dragMarkerRef.current?.setMap(null);
      dragMarkerRef.current = null;
      staticMarkersRef.current.forEach((marker) => marker.setMap(null));
      staticMarkersRef.current = [];
      mapRef.current = null;
    };
  }, [state, api, center, zoom]);

  // Recenter when the incoming center changes.
  useEffect(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.panTo(center);
    if (mapRef.current.getZoom() < zoom) mapRef.current.setZoom(zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on primitive coords, not the object ref
  }, [center?.lat, center?.lng, zoom]);

  // Draggable marker (used by the farm picker).
  useEffect(() => {
    if (state !== "ready" || !api || !mapRef.current) return;
    if (draggableMarker) {
      if (!dragMarkerRef.current) {
        const marker = new api.Marker({
          position: draggableMarker,
          map: mapRef.current,
          draggable: true,
          title: "Farm location",
        });
        marker.addListener("dragend", () => {
          const point = marker.getPosition();
          if (point && onMarkerDragEndRef.current) {
            onMarkerDragEndRef.current({ lat: point.lat(), lng: point.lng() });
          }
        });
        dragMarkerRef.current = marker;
      } else {
        dragMarkerRef.current.setPosition(draggableMarker);
      }
    } else if (dragMarkerRef.current) {
      dragMarkerRef.current.setMap(null);
      dragMarkerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on primitive coords, not the object ref
  }, [state, api, draggableMarker?.lat, draggableMarker?.lng]);

  // Static markers (used by the supplier directory map).
  const markerKey = markers.map((m) => `${m.id}:${m.lat},${m.lng}`).join("|");
  useEffect(() => {
    if (state !== "ready" || !api || !mapRef.current) return;
    staticMarkersRef.current.forEach((marker) => marker.setMap(null));
    staticMarkersRef.current = markers.map((entry) => {
      const marker = new api.Marker({
        position: { lat: entry.lat, lng: entry.lng },
        map: mapRef.current,
        title: entry.title,
      });
      if (entry.onClick) marker.addListener("click", entry.onClick);
      return marker;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- markerKey encodes the marker list
  }, [state, api, markerKey]);

  const boxStyle = { height: typeof height === "number" ? `${height}px` : height };

  if (state === "missing-key" || state === "error") {
    return (
      <div
        className={className ?? "grid w-full place-items-center bg-muted/50 p-6 text-center"}
        style={boxStyle}
      >
        {emptyFallback ?? (
          <p className="max-w-xs text-xs leading-5 text-muted-foreground">
            {state === "missing-key"
              ? "Interactive map is unavailable. Enter your address above to continue."
              : "The map could not be loaded. Enter your address above to continue."}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className ?? "relative w-full"} style={boxStyle}>
      <div ref={containerRef} className="h-full w-full" aria-label="Map" role="application" />
      {state === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-muted/40 text-xs text-muted-foreground">
          Loading map…
        </div>
      )}
    </div>
  );
}
