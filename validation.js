// Recipe validation. Kept free of page code so it runs in the browser and in Node tests.

// Returns a message for each invalid field, using the rules in REQUIREMENTS.md.
function validateRecipe(recipe) {
  const errors = {};
  if (!recipe.name) errors.name = "Enter a recipe name.";
  else if (recipe.name.length > 100) errors.name = "Keep the name to 100 characters or fewer.";
  if (!recipe.ingredients.length) errors.ingredients = "Add at least one ingredient.";
  if (!(recipe.cook_time >= 1 && recipe.cook_time <= 1440)) errors.cook_time = "Enter a whole number from 1 to 1440.";
  return errors;
}

// Browsers ignore this; Node tests use it to import the function.
if (typeof module !== "undefined") module.exports = { validateRecipe };
