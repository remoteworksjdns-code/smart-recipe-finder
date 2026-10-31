// Netlify Function: searches Spoonacular server-side so the API key never reaches the browser.
// GET /.netlify/functions/search?q=pasta returns { recipes: [{ id, name, ingredients, cook_time }] }.

const SEARCH_URL = "https://api.spoonacular.com/recipes/complexSearch";
const MAX_RESULTS = 10;
const MAX_TERM_LENGTH = 100;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

// Spoonacular may list ingredients in extendedIngredients or split them by used and missed.
function toRecipe(result) {
  const ingredients = result.extendedIngredients?.length
    ? result.extendedIngredients
    : [
        ...(result.usedIngredients || []),
        ...(result.missedIngredients || []),
        ...(result.unusedIngredients || [])
      ];

  return {
    id: result.id,
    name: result.title,
    ingredients: ingredients.map(i => i.original || i.name).filter(Boolean),
    cook_time: result.readyInMinutes
  };
}

exports.handler = async event => {
  if (event.httpMethod !== "GET") return jsonResponse(405, { error: "Use a GET request." });

  const term = (event.queryStringParameters?.q || "").trim();
  if (!term) return jsonResponse(400, { error: "Enter something to search for." });
  if (term.length > MAX_TERM_LENGTH) return jsonResponse(400, { error: "Keep the search to 100 characters or fewer." });

  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    console.error("SPOONACULAR_API_KEY is not set");
    return jsonResponse(500, { error: "Online search isn't set up yet." });
  }

  const params = new URLSearchParams({
    query: term,
    number: String(MAX_RESULTS),
    addRecipeInformation: "true",
    fillIngredients: "true"
  });

  try {
    // The key goes in a header, so it stays out of URLs and any logs that record them.
    const response = await fetch(`${SEARCH_URL}?${params}`, { headers: { "x-api-key": apiKey } });

    if (response.status === 402 || response.status === 429) {
      return jsonResponse(503, { error: "The online search limit has been reached. Try again later." });
    }
    if (!response.ok) {
      console.error("Spoonacular request failed with status", response.status);
      return jsonResponse(502, { error: "Couldn't reach the online recipe search. Try again later." });
    }

    const data = await response.json();
    return jsonResponse(200, { recipes: (data.results || []).map(toRecipe) });
  } catch (err) {
    console.error("Spoonacular request failed:", err.message);
    return jsonResponse(502, { error: "Couldn't reach the online recipe search. Try again later." });
  }
};
