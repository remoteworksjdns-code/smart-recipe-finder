# Smart Recipe Finder

Find something to cook based on what's in your kitchen or how much time you have. Browse and save your own recipes, search for new ones online, or ask AI for an idea.

**Live URL:** [ADD LIVE URL HERE]

## Features

- **Browse recipes:** see every saved recipe with its cook time and ingredients, shortest cook time first.
- **Search by ingredient:** enter one or more ingredients, separated by commas, to see recipes that include all of them.
- **Filter by cook time:** show recipes that take 15, 30 or 60 minutes or less. This works together with ingredient search.
- **Save your own recipes:** add a name, ingredients and cook time. Saved recipes are stored in the cloud.
- **Find recipes online:** search Spoonacular's recipe database and see the results in the same cards as your saved recipes.
- **Get a suggestion:** list the ingredients you have, and AI suggests one recipe idea.
- **Quick Meal badge:** recipes that take 30 minutes or less are marked "Quick Meal".

## Tech stack

| Part | Technology |
|---|---|
| Front end | Vanilla JavaScript, HTML and CSS |
| Database | [Supabase](https://supabase.com) |
| Online recipe search | [Spoonacular API](https://spoonacular.com/food-api) |
| AI suggestions | NVIDIA's API with the `openai/gpt-oss-20b` model |
| Server-side functions and hosting | [Netlify Functions](https://docs.netlify.com/build/functions/overview/) |

Spoonacular and NVIDIA are called from Netlify Functions, so their API keys stay on the server and never reach the browser.

## Run it locally

You'll need [Node.js](https://nodejs.org) 18 or later, plus a Spoonacular API key and an NVIDIA API key.

1. Clone this repository and open the project folder.

2. Install the Netlify CLI. The app has no other packages to install.

   ```
   npm install -g netlify-cli
   ```

3. Create a file named `.env` in the project root and add your keys (see [Environment variables](#environment-variables)).

4. Start the app:

   ```
   netlify dev
   ```

5. Open [http://localhost:8888](http://localhost:8888).

Use `netlify dev` rather than opening `index.html` directly, because online search and suggestions need the Netlify Functions to be running. Restart `netlify dev` after changing `.env`.

## Environment variables

| Variable | Used for | Where to get it |
|---|---|---|
| `SPOONACULAR_API_KEY` | Online recipe search | [Spoonacular console](https://spoonacular.com/food-api/console) |
| `NVIDIA_API_KEY` | AI recipe suggestions | [build.nvidia.com](https://build.nvidia.com/openai/gpt-oss-20b) |

Your `.env` file should look like this:

```
SPOONACULAR_API_KEY=your-spoonacular-key
NVIDIA_API_KEY=your-nvidia-key
```

`.env` is listed in `.gitignore`, so never commit it or put these keys in any other file. When you deploy, add both variables to your Netlify site's environment variables, because `.env` isn't deployed.

## Database

Saved recipes are stored in a Supabase table named `recipes`:

| Column | Type | Notes |
|---|---|---|
| `id` | Auto-generated | Assigned by Supabase |
| `name` | Text | 1–100 characters |
| `ingredients` | List of text | At least one item |
| `cook_time` | Integer | Minutes, from 1 to 1440 |

The Supabase Project URL and Publishable key are in `db.js`. They're public by design, so they're safe to commit. To use your own Supabase project, replace them there. Never put a Supabase secret or service role key in `db.js`.

## Project structure

```
├── index.html               Page layout
├── style.css                Styles
├── recipe.js                App logic and recipe cards
├── validation.js            Recipe form validation
├── db.js                    Supabase client
├── netlify/functions/
│   ├── search.js            Calls Spoonacular
│   └── suggest.js           Calls NVIDIA
├── netlify.toml             Netlify settings
├── check-supabase.js        Tests the Supabase connection
└── check-spoonacular.js     Tests the Spoonacular key
```
