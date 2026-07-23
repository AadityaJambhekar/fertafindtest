import assert from "node:assert/strict";
import test from "node:test";
import { buildFarmLocation } from "./google-maps-loader.ts";

const usComponents = [
  { long_name: "Ames", short_name: "Ames", types: ["locality", "political"] },
  { long_name: "Story County", short_name: "Story County", types: ["administrative_area_level_2"] },
  { long_name: "Iowa", short_name: "IA", types: ["administrative_area_level_1", "political"] },
  { long_name: "United States", short_name: "US", types: ["country", "political"] },
  { long_name: "50011", short_name: "50011", types: ["postal_code"] },
];

test("buildFarmLocation maps address components to the location contract", () => {
  const loc = buildFarmLocation({
    placeId: "abc123",
    formattedAddress: "Ames, IA 50011, USA",
    latitude: 42.0308,
    longitude: -93.6319,
    components: usComponents,
  });
  assert.equal(loc.city, "Ames");
  assert.equal(loc.state, "Iowa");
  assert.equal(loc.country, "United States");
  assert.equal(loc.postalCode, "50011");
  assert.equal(loc.placeId, "abc123");
  assert.equal(loc.formattedAddress, "Ames, IA 50011, USA");
});

test("backward-compatible display_name/lat/lon are stringified from the coordinates", () => {
  const loc = buildFarmLocation({
    formattedAddress: "Ames, IA 50011, USA",
    latitude: 42.0308,
    longitude: -93.6319,
    components: usComponents,
  });
  // The Analyze submit() posts display_name/lat/lon — these must stay populated.
  assert.equal(loc.display_name, "Ames, IA 50011, USA");
  assert.equal(loc.lat, "42.0308");
  assert.equal(loc.lon, "-93.6319");
  assert.equal(loc.latitude, 42.0308);
  assert.equal(loc.longitude, -93.6319);
});

test("city falls back to postal_town when locality is absent", () => {
  const loc = buildFarmLocation({
    formattedAddress: "Reading, UK",
    latitude: 51.45,
    longitude: -0.97,
    components: [
      { long_name: "Reading", short_name: "Reading", types: ["postal_town"] },
      { long_name: "England", short_name: "England", types: ["administrative_area_level_1"] },
      { long_name: "United Kingdom", short_name: "GB", types: ["country"] },
    ],
  });
  assert.equal(loc.city, "Reading");
  assert.equal(loc.country, "United Kingdom");
  assert.equal(loc.postalCode, undefined);
});

test("missing components leave rich fields undefined but keep coordinates", () => {
  const loc = buildFarmLocation({
    formattedAddress: "Somewhere",
    latitude: 10,
    longitude: 20,
  });
  assert.equal(loc.city, undefined);
  assert.equal(loc.state, undefined);
  assert.equal(loc.country, undefined);
  assert.equal(loc.postalCode, undefined);
  assert.equal(loc.display_name, "Somewhere");
  assert.equal(loc.lat, "10");
  assert.equal(loc.lon, "20");
});
