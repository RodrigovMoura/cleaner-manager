import { NextRequest, NextResponse } from "next/server";

interface GooglePlacePrediction {
  place_id: string;
  description: string;
}

interface GoogleAutocompleteResponse {
  status: string;
  error_message?: string;
  predictions?: GooglePlacePrediction[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");
  const sessionToken = searchParams.get("sessionToken");

  if (!input || input.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("Google Places API key is not configured in environment variables.");
    return NextResponse.json({ error: "Google Places API key is not configured.", predictions: [] }, { status: 500 });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input.trim());
    url.searchParams.set("key", apiKey);
    url.searchParams.set("components", "country:au"); // Restringe para a Austrália

    if (sessionToken) {
      url.searchParams.set("sessiontoken", sessionToken);
    }

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error("Google Places API HTTP error:", res.status, res.statusText);
      return NextResponse.json({ predictions: [] });
    }

    const data: GoogleAutocompleteResponse = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error status:", data.status, data.error_message);
      return NextResponse.json({ predictions: [] });
    }

    const predictions = (data.predictions || []).map((p: GooglePlacePrediction) => ({
      placeId: p.place_id,
      description: p.description,
    }));

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error("Failed to fetch address suggestions:", error);
    return NextResponse.json({ predictions: [] }, { status: 500 });
  }
}
