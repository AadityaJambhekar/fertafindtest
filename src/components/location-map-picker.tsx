import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type Coordinates = {
  lat: number;
  lon: number;
};

type LocationMapPickerProps = {
  center: Coordinates | null;
  onPinDrop: (coordinates: Coordinates) => void;
};

export function LocationMapPicker({ center, onPinDrop }: LocationMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onPinDropRef = useRef(onPinDrop);
  const initialCenterRef = useRef(center);

  useEffect(() => {
    onPinDropRef.current = onPinDrop;
  }, [onPinDrop]);

  useEffect(() => {
    let disposed = false;

    void import("leaflet").then((leaflet) => {
      if (disposed || !containerRef.current || mapRef.current) return;

      const map = leaflet.map(containerRef.current, {
        center: initialCenterRef.current
          ? [initialCenterRef.current.lat, initialCenterRef.current.lon]
          : [20, 0],
        zoom: initialCenterRef.current ? 12 : 2,
        zoomControl: false,
      });
      leaflet.control.zoom({ position: "bottomright" }).addTo(map);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map);

      const pinIcon = leaflet.divIcon({
        className: "fertafind-map-pin",
        html: '<span aria-hidden="true">●</span>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const placePin = (coordinates: Coordinates, pan = false) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([coordinates.lat, coordinates.lon]);
        } else {
          markerRef.current = leaflet
            .marker([coordinates.lat, coordinates.lon], { draggable: true, icon: pinIcon })
            .addTo(map);
          markerRef.current.on("dragend", () => {
            const point = markerRef.current?.getLatLng();
            if (point) onPinDropRef.current({ lat: point.lat, lon: point.lng });
          });
        }
        if (pan) map.panTo([coordinates.lat, coordinates.lon]);
      };

      if (initialCenterRef.current) placePin(initialCenterRef.current);
      map.on("click", (event) => {
        const coordinates = { lat: event.latlng.lat, lon: event.latlng.lng };
        placePin(coordinates);
        onPinDropRef.current(coordinates);
      });
      mapRef.current = map;
    });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!center || !mapRef.current) return;

    void import("leaflet").then((leaflet) => {
      const map = mapRef.current;
      if (!map) return;
      const point: [number, number] = [center.lat, center.lon];
      map.setView(point, Math.max(map.getZoom(), 12), { animate: true });
      if (markerRef.current) {
        markerRef.current.setLatLng(point);
      } else {
        const pinIcon = leaflet.divIcon({
          className: "fertafind-map-pin",
          html: '<span aria-hidden="true">●</span>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        markerRef.current = leaflet.marker(point, { draggable: true, icon: pinIcon }).addTo(map);
        markerRef.current.on("dragend", () => {
          const point = markerRef.current?.getLatLng();
          if (point) onPinDropRef.current({ lat: point.lat, lon: point.lng });
        });
      }
    });
  }, [center]);

  return <div ref={containerRef} className="h-72 w-full bg-muted" aria-label="Farm location map" />;
}
