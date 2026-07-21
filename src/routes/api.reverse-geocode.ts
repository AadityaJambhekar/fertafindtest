import { createFileRoute } from "@tanstack/react-router";

type ReverseGeocodeResult = {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
};

let lastLookupAt = 0;

export const Route = createFileRoute("/api/reverse-geocode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const lat = Number(url.searchParams.get("lat"));
        const lon = Number(url.searchParams.get("lon"));
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          Math.abs(lat) > 90 ||
          Math.abs(lon) > 180
        ) {
          return Response.json({ error: "Choose a valid point on the map." }, { status: 400 });
        }

        const delay = Math.max(0, 1_050 - (Date.now() - lastLookupAt));
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
        lastLookupAt = Date.now();

        const endpoint = new URL("https://nominatim.openstreetmap.org/reverse");
        endpoint.searchParams.set("lat", String(lat));
        endpoint.searchParams.set("lon", String(lon));
        endpoint.searchParams.set("format", "jsonv2");
        endpoint.searchParams.set("zoom", "18");

        try {
          const response = await fetch(endpoint, {
            headers: {
              Accept: "application/json",
              "Accept-Language": "en",
              "User-Agent": "FertaFind/1.0 (fertafind@gmail.com)",
            },
          });
          if (!response.ok) {
            return Response.json(
              { error: "The map service is temporarily unavailable." },
              { status: 502 },
            );
          }

          const result = (await response.json()) as ReverseGeocodeResult;
          return Response.json({ result });
        } catch {
          return Response.json({ error: "The map service could not be reached." }, { status: 502 });
        }
      },
    },
  },
});
