// Smart Recipe Finder: loads recipes from Supabase and renders them as recipe cards.
// Field names (id, name, ingredients, cook_time) match REQUIREMENTS.md and the database columns.

// While online results are showing, they sit in state.recipes and savedRecipes keeps the saved list.
const state = { recipes: [], savedRecipes: null, query: "", maxTime: 0 };

const listEl = document.getElementById("recipes");
const statusEl = document.getElementById("status");
const searchEl = document.getElementById("search");
const chipEls = document.querySelectorAll(".chip[data-max]");
const addRecipeEl = document.getElementById("add-recipe");
const formEl = document.getElementById("recipe-form");
const nameEl = document.getElementById("recipe-name");
const ingredientsEl = document.getElementById("recipe-ingredients");
const cookTimeEl = document.getElementById("recipe-cook-time");
const saveEl = document.getElementById("recipe-save");
const formStatusEl = document.getElementById("form-status");
const webFormEl = document.getElementById("web-search");
const webTermEl = document.getElementById("web-term");
const webSubmitEl = document.getElementById("web-submit");
const webClearEl = document.getElementById("web-clear");
const webStatusEl = document.getElementById("web-status");
const suggestFormEl = document.getElementById("suggest-form");
const suggestIngredientsEl = document.getElementById("suggest-ingredients");
const suggestSubmitEl = document.getElementById("suggest-submit");
const suggestStatusEl = document.getElementById("suggest-status");
const suggestResultEl = document.getElementById("suggest-result");

const RECIPE_COLUMNS = "id, name, ingredients, cook_time";
const SEARCH_UNAVAILABLE = "Online search isn't available. Run the app with netlify dev, then try again.";
const SUGGEST_UNAVAILABLE = "Suggestions aren't available. Run the app with netlify dev, then try again.";

async function loadRecipes() {
  try {
    const { data, error } = await db.from("recipes").select(RECIPE_COLUMNS);
    if (error) throw error;
    state.recipes = data;
    render();
  } catch (err) {
    statusEl.textContent = "Couldn't load recipes from the cloud. Check your connection, then reload.";
    statusEl.classList.add("error");
    console.error(err);
  }
}

// Supabase assigns the id, so the insert only sends name, ingredients and cook_time.
async function saveRecipe(recipe) {
  const { data, error } = await db.from("recipes").insert(recipe).select(RECIPE_COLUMNS).single();
  if (error) throw error;
  return data;
}

// Calls the Netlify function, which holds the API key and returns recipes in the saved-recipe shape.
async function searchOnline(term) {
  const response = await fetch("/.netlify/functions/search?q=" + encodeURIComponent(term)).catch(() => null);
  const body = await response?.json().catch(() => null);
  if (!response?.ok || !body?.recipes) throw new Error(body?.error || SEARCH_UNAVAILABLE);
  return body.recipes;
}

// Calls the Netlify function, which holds the API key and returns { name, description }.
async function suggestRecipe(ingredients) {
  const response = await fetch("/.netlify/functions/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients })
  }).catch(() => null);
  const body = await response?.json().catch(() => null);
  if (!response?.ok || !body?.name) throw new Error(body?.error || SUGGEST_UNAVAILABLE);
  return body;
}

function showSavedRecipes() {
  if (!state.savedRecipes) return;
  state.recipes = state.savedRecipes;
  state.savedRecipes = null;
  webClearEl.hidden = true;
  webStatusEl.textContent = "";
}

// Ingredients: one per line, trimmed, blank lines dropped.
function readForm() {
  const cookTime = cookTimeEl.value.trim();
  return {
    name: nameEl.value.trim(),
    ingredients: ingredientsEl.value.split("\n").map(i => i.trim()).filter(Boolean),
    cook_time: /^\d+$/.test(cookTime) ? Number(cookTime) : NaN
  };
}

function showFormErrors(errors) {
  for (const field of ["name", "ingredients", "cook_time"]) {
    document.getElementById("error-" + field).textContent = errors[field] || "";
  }
}

// Search terms: comma-separated, trimmed, case-insensitive.
function getTerms() {
  return state.query.toLowerCase().split(",").map(t => t.trim()).filter(Boolean);
}

// A recipe matches when every term appears in at least one of its ingredients.
function matchesAll(recipe, terms) {
  return terms.every(term => recipe.ingredients.some(ing => ing.toLowerCase().includes(term)));
}

// Recipes at or under this many minutes get a "Quick Meal" badge.
const QUICK_MEAL_MAX = 30;

function getVisibleRecipes() {
  const terms = getTerms();
  return state.recipes
    .filter(r => !state.maxTime || r.cook_time <= state.maxTime)
    .filter(r => matchesAll(r, terms))
    .sort((a, b) => a.cook_time - b.cook_time);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderCard(recipe, terms) {
  const card = el("article", "card");
  card.dataset.id = recipe.id;

  card.append(el("h2", null, recipe.name));

  const meta = el("div", "meta");
  meta.append(el("span", "time", recipe.cook_time + " min"));
  if (recipe.cook_time <= QUICK_MEAL_MAX) meta.append(el("span", "badge-quick", "Quick Meal"));
  card.append(meta);

  const list = el("ul", "ingredients");
  for (const ing of recipe.ingredients) {
    const li = el("li");
    const isHit = terms.some(t => ing.toLowerCase().includes(t));
    li.append(isHit ? el("mark", null, ing) : document.createTextNode(ing));
    list.append(li);
  }
  card.append(list);

  return card;
}

// The add form starts collapsed, so the link opens it before moving focus to the first field.
function renderEmptyState() {
  const empty = el("p", "empty", "No recipes yet. ");
  const link = el("a", null, "Add your first recipe");
  link.href = "#add-recipe";
  link.addEventListener("click", event => {
    event.preventDefault();
    addRecipeEl.open = true;
    nameEl.focus();
  });
  empty.append(link);
  return empty;
}

function render() {
  const terms = getTerms();
  const visible = getVisibleRecipes();
  listEl.replaceChildren();

  if (!state.recipes.length) {
    statusEl.textContent = "";
    listEl.append(renderEmptyState());
    return;
  }

  if (!visible.length) {
    statusEl.textContent = "";
    listEl.append(el("p", "empty", "No recipes match. Try fewer ingredients or a longer cook time."));
    return;
  }

  const filtered = terms.length || state.maxTime;
  statusEl.textContent = visible.length + (visible.length === 1 ? " recipe" : " recipes") + (filtered ? " found" : "");
  for (const recipe of visible) listEl.append(renderCard(recipe, terms));
}

searchEl.addEventListener("input", () => {
  state.query = searchEl.value;
  render();
});

chipEls.forEach(chip => {
  chip.addEventListener("click", () => {
    state.maxTime = Number(chip.dataset.max);
    chipEls.forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
    render();
  });
});

// Clears the search and cook-time filter, so everything in the list is visible.
function clearFilters() {
  searchEl.value = "";
  state.query = "";
  chipEls[0].click();
}

webFormEl.addEventListener("submit", async event => {
  event.preventDefault();

  const term = webTermEl.value.trim();
  if (!term) {
    webStatusEl.textContent = "Enter something to search for.";
    return;
  }

  webSubmitEl.disabled = true;
  webStatusEl.textContent = "Searching…";
  try {
    const recipes = await searchOnline(term);
    if (!recipes.length) {
      webStatusEl.textContent = `No online recipes found for "${term}".`;
      return;
    }
    state.savedRecipes ??= state.recipes;
    state.recipes = recipes;
    webClearEl.hidden = false;
    clearFilters();
    webStatusEl.textContent = `Showing online results for "${term}".`;
  } catch (err) {
    webStatusEl.textContent = err.message;
    console.error(err);
  } finally {
    webSubmitEl.disabled = false;
  }
});

webClearEl.addEventListener("click", () => {
  showSavedRecipes();
  render();
});

function renderSuggestion({ name, description }) {
  const card = el("article", "card");
  card.append(el("h2", null, name), el("p", null, description));
  suggestResultEl.replaceChildren(card);
}

suggestFormEl.addEventListener("submit", async event => {
  event.preventDefault();
  suggestResultEl.replaceChildren();

  const ingredients = suggestIngredientsEl.value.split(",").map(i => i.trim()).filter(Boolean);
  if (!ingredients.length) {
    suggestStatusEl.textContent = "Enter at least one ingredient.";
    return;
  }

  suggestSubmitEl.disabled = true;
  suggestStatusEl.textContent = "Thinking of a recipe… This can take a little while.";
  try {
    renderSuggestion(await suggestRecipe(ingredients));
    suggestStatusEl.textContent = "";
  } catch (err) {
    suggestStatusEl.textContent = err.message;
    console.error(err);
  } finally {
    suggestSubmitEl.disabled = false;
  }
});

formEl.addEventListener("submit", async event => {
  event.preventDefault();
  formStatusEl.textContent = "";

  const recipe = readForm();
  const errors = validateRecipe(recipe);
  showFormErrors(errors);
  if (Object.keys(errors).length) return;

  saveEl.disabled = true;
  try {
    const saved = await saveRecipe(recipe);
    showSavedRecipes();
    state.recipes.push(saved);
    formEl.reset();
    statusEl.classList.remove("error");
    // Clear the search and cook-time filter so the new recipe is visible straight away.
    clearFilters();
    formStatusEl.textContent = "Recipe saved.";
  } catch (err) {
    formStatusEl.textContent = "Couldn't save the recipe. Please try again.";
    console.error(err);
  } finally {
    saveEl.disabled = false;
  }
});

loadRecipes();
