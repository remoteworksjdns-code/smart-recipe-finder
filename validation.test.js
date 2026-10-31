const test = require("node:test");
const assert = require("node:assert");
const { validateRecipe } = require("./validation.js");

// Story 4: saving is blocked if cook time is not a whole number from 1 to 1440.
test("rejects a negative cook time", () => {
  const errors = validateRecipe({ name: "Omelette", ingredients: ["2 eggs"], cook_time: -5 });

  assert.deepStrictEqual(errors, { cook_time: "Enter a whole number from 1 to 1440." });
});
