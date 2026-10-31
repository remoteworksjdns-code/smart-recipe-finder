// Checks that the Spoonacular key in .env is valid and that search.js sends a correct request.
// Run: node check-spoonacular.js
// Makes 2 real API calls, which use a small part of the daily quota. Never prints the key.

const path = require("path");

const ENDPOINT = "https://api.spoonacular.com/recipes/complexSearch";
const TERM = "pasta";

process.loadEnvFile(path.join(__dirname, ".env"));
const key = (process.env.SPOONACULAR_API_KEY || "").trim();

const quota = response => ["used", "left", "request"]
  .map(name => `${name}=${response.headers.get(`x-api-quota-${name}`) ?? "?"}`)
  .join(" ");

function explain(status) {
  if (status === 401) return "The key was rejected. Check it in your Spoonacular dashboard.";
  if (status === 402) return "The key is valid, but the daily quota is used up.";
  if (status === 429) return "Too many requests. Wait a moment and try again.";
  return `Unexpected response from Spoonacular (HTTP ${status}).`;
}

// Calls Spoonacular the simplest way possible, so only the key is being tested.
async function checkKey() {
  const response = await fetch(`${ENDPOINT}?query=${TERM}&number=1`, { headers: { "x-api-key": key } });
  console.log(`      HTTP ${response.status}, quota: ${quota(response)}`);
  if (!response.ok) {
    console.log(`FAIL  Key: ${explain(response.status)}`);
    return false;
  }
  console.log("PASS  Key: Spoonacular accepted it.");
  return true;
}

// Runs the real handler and records the request it makes, then checks that request and its result.
async function checkSearchFunction() {
  const { handler } = require("./netlify/functions/search.js");
  const realFetch = global.fetch;
  const sent = {};
  global.fetch = async (url, init) => {
    Object.assign(sent, { url: new URL(url), init });
    const response = await realFetch(url, init);
    sent.status = response.status;
    return response;
  };

  const result = await handler({ httpMethod: "GET", queryStringParameters: { q: TERM } });
  global.fetch = realFetch;

  if (!sent.url) {
    console.log(`FAIL  search.js made no request. It returned HTTP ${result.statusCode}: ${result.body}`);
    return false;
  }

  const params = sent.url.searchParams;
  const checks = {
    "correct endpoint": sent.url.origin + sent.url.pathname === ENDPOINT,
    "search term sent as query": params.get("query") === TERM,
    "asks for recipe details": params.get("addRecipeInformation") === "true",
    "asks for ingredients": params.get("fillIngredients") === "true",
    "key sent in header": sent.init?.headers?.["x-api-key"] === key,
    "key not in URL": !sent.url.href.includes(key)
  };
  for (const [name, ok] of Object.entries(checks)) console.log(`${ok ? "PASS" : "FAIL"}  Request: ${name}`);

  console.log(`      Spoonacular answered HTTP ${sent.status}; search.js returned HTTP ${result.statusCode}`);
  const body = JSON.parse(result.body);
  if (result.statusCode !== 200) {
    console.log(`FAIL  Response: ${body.error}`);
    return false;
  }

  const recipes = body.recipes;
  const shaped = recipes.every(r => r.name && Array.isArray(r.ingredients) && r.ingredients.length && Number.isInteger(r.cook_time));
  console.log(`${recipes.length ? "PASS" : "FAIL"}  Response: ${recipes.length} recipe(s) returned.`);
  console.log(`${shaped ? "PASS" : "FAIL"}  Response: recipes have name, ingredients and cook_time.`);
  return Object.values(checks).every(Boolean) && recipes.length > 0 && shaped;
}

(async () => {
  if (!key) {
    console.log("FAIL  SPOONACULAR_API_KEY is missing from .env.");
    process.exitCode = 1;
    return;
  }
  console.log(`PASS  .env has a key (${key.length} characters).`);

  const keyOk = await checkKey();
  const requestOk = await checkSearchFunction();
  process.exitCode = keyOk && requestOk ? 0 : 1;
})().catch(err => {
  console.log(`FAIL  Couldn't reach Spoonacular: ${err.message}`);
  process.exitCode = 1;
});
