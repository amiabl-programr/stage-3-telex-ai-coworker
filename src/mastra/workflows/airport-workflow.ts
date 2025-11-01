import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const airportSchema = z.object({
  name: z.string(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  iata_code: z.string().nullable(),
  icao_code: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  timezone: z.string().nullable(),
});

// 🔹 Step 1 — Fetch airport info
const fetchAirportInfo = createStep({
  id: "fetch-airport-info",
  description: "Fetches airport details by name or IATA/ICAO code",
  inputSchema: z.object({
    query: z.string().describe("Airport name or code"),
  }),
  outputSchema: airportSchema,
  execute: async ({ inputData }) => {
    if (!inputData) throw new Error("Input data not found.");

    const url = `http://api.aviationstack.com/v1/airports?access_key=${process.env.AVIATIONSTACK_API_KEY}&search=${encodeURIComponent(
      inputData.query
    )}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.data || !data.data.length) {
      throw new Error(`No airport found for '${inputData.query}'`);
    }

    const airport = data.data[0];
    return {
      name: airport.airport_name || "Unknown",
      city: airport.city_name || null,
      country: airport.country_name || null,
      iata_code: airport.iata_code || null,
      icao_code: airport.icao_code || null,
      latitude: airport.latitude || null,
      longitude: airport.longitude || null,
      timezone: airport.timezone || null,
    };
  },
});

// 🔹 Step 2 — Summarize using Gemini
const summarizeAirport = createStep({
  id: "summarize-airport",
  description: "Summarizes airport information for travelers/students",
  inputSchema: airportSchema,
  outputSchema: z.object({
    summary: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error("Airport info not found.");
    const agent = mastra?.getAgent("airportInfoAgent");
    if (!agent) throw new Error("Airport agent not found.");

    const prompt = `
      Summarize this airport information clearly and professionally:
      ${JSON.stringify(inputData, null, 2)}

      Include:
      - Full name
      - City and country
      - IATA and ICAO codes
      - Timezone
      - Latitude/Longitude (approximate)
      - Short description of its importance or usage type (e.g., international hub, regional airport, etc.)
    `;

    const response = await agent.stream([{ role: "user", content: prompt }]);
    let summaryText = "";

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      summaryText += chunk;
    }

    return { summary: summaryText };
  },
});

// 🔹 Workflow definition
const airportInfoWorkflow = createWorkflow({
  id: "airport-info-workflow",
  inputSchema: z.object({
    query: z.string().describe("Airport name or code"),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
})
  .then(fetchAirportInfo)
  .then(summarizeAirport);

airportInfoWorkflow.commit();

export { airportInfoWorkflow };
