import { createFileRoute } from "@tanstack/react-router";

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  category?: string;
  type?: string;
  addresstype?: string;
  importance?: number;
  place_rank?: number;
};

const cache = new Map<string, NominatimResult | null>();
let lastLookupAt = 0;
const geocodeAttempts = new Map<string, number[]>();

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function requestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

function allowLookup(request: Request) {
  const ip = requestIp(request);
  const now = Date.now();
  const recent = (geocodeAttempts.get(ip) ?? []).filter((timestamp) => now - timestamp < 60_000);
  if (recent.length >= 20) {
    geocodeAttempts.set(ip, recent);
    return false;
  }
  recent.push(now);
  geocodeAttempts.set(ip, recent);
  return true;
}

function locationSearchQueries(query: string) {
  const correctedQuery = query
    .replace(/\bfransisco\b/gi, "Francisco")
    .replace(/\bfrnascio\b/gi, "Francisco");
  const parts = query
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const normalizedParts = parts.map((part) =>
    part
      .replace(/\b(regency|district|county|province|state)\b/gi, "")
      .replace(/\b\d{4,6}\b/g, "")
      .replace(/\s{2,}/g, " ")
      .trim(),
  );

  return [
    ...new Set([correctedQuery, normalizedParts.join(", "), normalizedParts.slice(1).join(", ")]),
  ].filter((candidate) => candidate.length >= 3);
}

function isLowConfidenceMatch(query: string, result: NominatimResult) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedName = normalizeSearchText(
    result.name || result.display_name.split(",")[0] || "",
  );
  const namedPlaceMatch =
    normalizedName.length >= 3 &&
    (normalizedQuery.includes(normalizedName) || normalizedName.includes(normalizedQuery));
  const namedPlaceCategories = new Set([
    "amenity",
    "building",
    "historic",
    "landuse",
    "leisure",
    "office",
    "shop",
    "tourism",
  ]);

  // Farms, businesses and landmarks often have very low global importance in
  // Nominatim. Keep a result when its actual name matches what was typed.
  if (namedPlaceMatch && namedPlaceCategories.has(result.category ?? "")) return false;

  const isShortPlaceName = query.split(",").length === 1 && query.trim().split(/\s+/).length <= 3;
  const isTinyPlace = (result.importance ?? 0) < 0.2 && (result.place_rank ?? 0) > 16;
  return isShortPlaceName && isTinyPlace;
}

export const Route = createFileRoute("/api/geocode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get("q")?.trim() ?? "";
        const wantsSuggestions = url.searchParams.get("suggestions") === "1";

        if (query.length < 3 || query.length > 160) {
          return Response.json({ error: "Enter at least three characters." }, { status: 400 });
        }

        if (!allowLookup(request)) {
          return Response.json(
            { error: "Too many location searches. Try again in a minute." },
            { status: 429, headers: { "Retry-After": "60" } },
          );
        }

        const cacheKey = `v2:${query.toLocaleLowerCase()}`;
        if (!wantsSuggestions && cache.has(cacheKey)) {
          return Response.json({ result: cache.get(cacheKey) });
        }

        try {
          let result: NominatimResult | null = null;
          let suggestions: NominatimResult[] = [];

          for (const candidate of locationSearchQueries(query)) {
            // The public Nominatim service permits at most one request per second.
            const delay = Math.max(0, 1_050 - (Date.now() - lastLookupAt));
            if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
            lastLookupAt = Date.now();

            const endpoint = new URL("https://nominatim.openstreetmap.org/search");
            endpoint.searchParams.set("q", candidate);
            endpoint.searchParams.set("format", "jsonv2");
            endpoint.searchParams.set("limit", wantsSuggestions ? "5" : "1");
            endpoint.searchParams.set("addressdetails", "1");
            endpoint.searchParams.set("namedetails", "1");

            const response = await fetch(endpoint, {
              headers: {
                Accept: "application/json",
                "Accept-Language": "en",
                "User-Agent": "FertaFind/1.0 (fertafind@gmail.com)",
              },
            });

            if (!response.ok) {
              return Response.json(
                { error: "The location service is temporarily unavailable." },
                { status: 502 },
              );
            }

            const results = (await response.json()) as NominatimResult[];
            const matches = results.filter((candidate) => !isLowConfidenceMatch(query, candidate));
            result = matches[0] ?? null;
            if (wantsSuggestions) suggestions = matches;
            if (result) break;
          }

          if (wantsSuggestions) {
            return Response.json(
              { results: suggestions },
              { headers: { "Cache-Control": "public, max-age=3600" } },
            );
          }

          cache.set(cacheKey, result);

          return Response.json(
            { result },
            { headers: { "Cache-Control": "public, max-age=86400" } },
          );
        } catch {
          return Response.json(
            { error: "The location service could not be reached." },
            { status: 502 },
          );
        }
      },
    },
  },
});
