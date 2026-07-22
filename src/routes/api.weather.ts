import { createFileRoute } from "@tanstack/react-router";
import { getFarmWeather } from "@/lib/weather";

export const Route = createFileRoute("/api/weather")({
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
          return Response.json({ error: "Choose a valid farm location first." }, { status: 400 });
        }

        try {
          return Response.json({ weather: await getFarmWeather(lat, lon) });
        } catch {
          return Response.json(
            { error: "Weather information is temporarily unavailable." },
            { status: 502 },
          );
        }
      },
    },
  },
});
