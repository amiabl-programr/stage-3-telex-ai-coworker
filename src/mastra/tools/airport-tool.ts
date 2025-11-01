import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const airportTool = createTool({
  id: "get-airport-info",
  description: "Fetch detailed airport information by name, or ICAO code using AirportDB.io.",
  inputSchema: z.object({
    query: z.string().describe("Airport name, city, or ICAO code"),
  }),
  outputSchema: z.object({
    name: z.string(),
    city: z.string().nullable(),
    country: z.string().nullable(),
    iata: z.string().nullable(),
    icao: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    timezone: z.string().nullable(),
    elevation: z.number().nullable(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    if (!context?.query) {
      throw new Error("Please provide an airport name or code.");
    }

    // Step 1️⃣ — Ask Gemini to convert airport name to code (IATA or ICAO)
    const geminiAPI = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`;
    const geminiPrompt = `
      You are a helpful aviation assistant.
      Convert the following airport name or city into its ICAO airport code (4 letters).
      If unsure, give your best possible match (e.g., "Heathrow" → "EGLL", "Murtala Muhammed" → "DNMM").
      Return only the code, nothing else.
      Query: "${context.query}"
    `;

    const geminiRes = await fetch(geminiAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: geminiPrompt }] }],
      }),
    });

    const geminiData = await geminiRes.json();
    console.log("Gemini response:", JSON.stringify(geminiData, null, 2));
    
    const iataCode =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() ||
      context.query.trim().toUpperCase();

    if (!iataCode || iataCode.length < 4) {
      throw new Error(`Couldn't determine an airport code for "${context.query}".`);
    }

    // Step 2️⃣ — Fetch data from AirportDB.io
    const dbUrl = `https://airportdb.io/api/v1/airport/${iataCode}?apiToken=${process.env.AIRPORT_DB_IO_API_KEY}`;
    const dbRes = await fetch(dbUrl);

    if (!dbRes.ok) {
      throw new Error(`AirportDB returned ${dbRes.status} for code '${iataCode}'.`);
    }

    const dbData = await dbRes.json();

    // Step 3️⃣ — Extract and clean results
    const name = dbData.name || "Unknown Airport";
    const city = dbData.city || null;
    const country = dbData.country?.name || null;
    const iata = dbData.iata || iataCode;
    const icao = dbData.icao || null;
    const latitude = dbData.latitude || null;
    const longitude = dbData.longitude || null;
    const timezone = dbData.timezone || null;
    const elevation = dbData.elevation_feet || null;

    const summary = `
      ✈️ ${name} (${iata || "N/A"} / ${icao || "N/A"})
      📍 ${city ? city + ", " : ""}${country || ""}
      🕐 Timezone: ${timezone || "Unknown"}
      🌐 Coordinates: ${latitude ? latitude.toFixed(2) : "N/A"}, ${longitude ? longitude.toFixed(2) : "N/A"}
      ⛰️ Elevation: ${elevation ? elevation + " ft" : "N/A"}
    `.trim();

    return {
      name,
      city,
      country,
      iata,
      icao,
      latitude,
      longitude,
      timezone,
      elevation,
      summary,
    };
  },
});
