# Smart Recipe Finder: Version 1 Requirements

A small app where people can browse recipes, save their own, and search by ingredient or cook time. Version 1 is scoped to be built in a single 3-hour session.

## 1. Core features

1. **Browse recipes.** A list of every recipe, showing its name, cook time and ingredients.
2. **Search by ingredient.** Type one or more ingredients and see only the recipes that use all of them.
3. **Filter by cook time.** Show only recipes that take no longer than a chosen number of minutes.
4. **Save your own recipe.** A form with name, ingredients and cook time that adds the recipe to the list.

Search and the cook-time filter work together. For example, "chicken, under 30 minutes" shows only recipes that pass both.

**Out of scope for version 1:** photos, cooking steps, servings, favourites, tags (such as vegetarian), user accounts, and editing or deleting recipes.

## 2. User stories

1. As a **home cook**, I want to **browse a list of recipes**, so that **I can find something to make without knowing exactly what I want**.
2. As a **home cook with leftovers**, I want to **search recipes by the ingredients I have**, so that **I can use up what's in my kitchen instead of buying more**.
3. As a **busy cook**, I want to **filter recipes by cook time**, so that **I only see dishes I have time to make tonight**.
4. As a **home cook with my own recipes**, I want to **save a recipe to the app**, so that **I can find it again alongside the others**.

## 3. Acceptance criteria

### Story 1: Browse recipes

- When the app opens, every stored recipe is shown in a list.
- Each item shows the recipe's name, cook time in minutes and full ingredient list.
- The list is sorted by cook time, shortest first.
- If there are no recipes, the app shows "No recipes yet" and a link to the add form instead of a blank screen.

### Story 2: Search by ingredient

- The user can type one or more ingredients separated by commas, such as `garlic, rice`.
- Only recipes that contain **every** typed ingredient are shown.
- Matching ignores upper and lower case and spaces around each word, so `Garlic` matches "2 cloves garlic".
- Clearing the search box shows all recipes again.
- If nothing matches, the app shows "No recipes match" and keeps the search text so the user can change it.

### Story 3: Filter by cook time

- The user can pick a maximum cook time from fixed options: Any, 15, 30 or 60 minutes.
- Only recipes whose `cook_time` is less than or equal to the chosen value are shown.
- "Any" is selected by default and shows all recipes.
- The filter can be combined with the ingredient search, and results must pass both.

### Story 4: Save your own recipe

- The form has three inputs: name, ingredients (one per line) and cook time (minutes).
- Saving is blocked, with a message next to the field, if:
  - the name is empty,
  - there are no ingredients, or
  - cook time is not a whole number from 1 to 1440.
- On a successful save, the recipe gets a new `id` automatically and appears in the list right away.
- A saved recipe is still there after the page is reloaded.

## 4. Recipe data fields

| Field | Type | Required | Rules |
|---|---|---|---|
| `id` | Unique ID (UUID or auto-increment integer) | Yes | Generated automatically on save. It is never typed by the user and never changes. |
| `name` | Text | Yes | 1–100 characters, with spaces trimmed from both ends. |
| `ingredients` | List of text items | Yes | At least one item. Each item is one ingredient with its amount, e.g. `"2 cloves garlic"`. Store it as a JSON array or as a separate table, not as one comma-separated string, so search can match individual items. |
| `cook_time` | Integer (minutes) | Yes | 1–1440. Storing whole minutes keeps the "30 minutes or less" filter a simple comparison. |

## 5. Open questions

- **Who owns a saved recipe?** With only the four fields above, every saved recipe goes into one shared list, and there's no way to show someone just their own. That works if version 1 has a single user or one shared list. If not, add an owner field such as `owner_id`.
- **Should recipes store a method?** There is no field for cooking steps. That's acceptable for a 3-hour "finder", but users may expect to see the steps when they open a recipe.
