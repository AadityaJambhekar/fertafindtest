import { createFileRoute } from "@tanstack/react-router";

type Product = { id: string; product_name: string; nitrogen_percent: number; phosphorus_percent: number; potassium_percent: number; package_kg: number | null; price_per_unit: number | null; delivery_per_tonne: number | null; currency: string; active: boolean };
type Supplier = { id: string; business_name: string; address: string; latitude: number; longitude: number; delivery_radius_km: number; description: string | null; website: string | null; phone: string | null; supplier_products: Product[] | null };
type OSMElement = { id: number; type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
const osmCache = new Map<string, { expiresAt: number; suppliers: unknown[] }>();

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = radians(lat2 - lat1);
  const deltaLon = radians(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function discoverOpenStreetMapSuppliers(lat: number, lon: number, radiusKm: number) {
  const radiusMetres = Math.min(radiusKm, 50) * 1000;
  const cacheKey = `${lat.toFixed(2)}:${lon.toFixed(2)}:${radiusMetres}`;
  const cached = osmCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.suppliers;
  const query = `[out:json][timeout:20];(nwr["shop"="agrarian"](around:${radiusMetres},${lat},${lon});nwr["agrarian"~"fertilizer"](around:${radiusMetres},${lat},${lon});nwr["shop"="trade"]["trade"="agricultural_supplies"](around:${radiusMetres},${lat},${lon}););out center tags;`;
  const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) return [];
  const data = (await response.json()) as { elements?: OSMElement[] };
  const suppliers = (data.elements ?? []).flatMap((element) => {
    const point = element.center ?? (element.lat !== undefined && element.lon !== undefined ? { lat: element.lat, lon: element.lon } : null);
    const tags = element.tags ?? {};
    if (!point || !tags.name) return [];
    return [{ id: `osm-${element.type}-${element.id}`, business_name: tags.name, address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(" ") || "Address not listed", latitude: point.lat, longitude: point.lon, distanceKm: Math.round(distanceKm(lat, lon, point.lat, point.lon) * 10) / 10, description: tags.description ?? null, website: tags.website ?? null, phone: tags.phone ?? tags["contact:phone"] ?? null, products: [], source: "OpenStreetMap" }];
  });
  osmCache.set(cacheKey, { expiresAt: Date.now() + 60 * 60 * 1000, suppliers });
  return suppliers;
}

export const Route = createFileRoute("/api/nearby-suppliers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const lat = Number(url.searchParams.get("lat"));
        const lon = Number(url.searchParams.get("lon"));
        const farmerRadiusKm = Math.min(Math.max(Number(url.searchParams.get("radiusKm")) || 50, 1), 1000);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Response.json({ error: "A farm location is required." }, { status: 400 });

        const supabaseUrl = process.env.SUPABASE_URL;
        const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        let listedSuppliers: Array<Record<string, unknown>> = [];

        if (supabaseUrl && publicKey) {
          const endpoint = new URL("/rest/v1/suppliers", supabaseUrl);
          endpoint.searchParams.set("select", "id,business_name,address,latitude,longitude,delivery_radius_km,description,website,phone,supplier_products(id,product_name,nitrogen_percent,phosphorus_percent,potassium_percent,package_kg,price_per_unit,delivery_per_tonne,currency,active)");
          endpoint.searchParams.set("status", "eq.approved");
          const response = await fetch(endpoint, { headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}` }, signal: AbortSignal.timeout(8_000) });
          if (response.ok) {
            const suppliers = (await response.json()) as Supplier[];
            listedSuppliers = suppliers
          .map((supplier) => ({ ...supplier, distanceKm: Math.round(distanceKm(lat, lon, supplier.latitude, supplier.longitude) * 10) / 10, products: (supplier.supplier_products ?? []).filter((product) => product.active) }))
          .filter((supplier) => supplier.distanceKm <= Math.min(farmerRadiusKm, supplier.delivery_radius_km))
              .map((supplier) => ({ ...supplier, source: "FertaFind" }));
          }
        }
        const mappedSuppliers = await discoverOpenStreetMapSuppliers(lat, lon, farmerRadiusKm).catch(() => []);
        const nearby = [...listedSuppliers, ...mappedSuppliers].sort((a: any, b: any) => a.distanceKm - b.distanceKm).slice(0, 10);
        return Response.json({ suppliers: nearby, openStreetMapAttribution: mappedSuppliers.length > 0 }, { headers: { "Cache-Control": "public, max-age=300" } });
      },
    },
  },
});
