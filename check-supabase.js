// Checks that the Supabase "recipes" table can be read and written with the credentials in db.js.
//   node check-supabase.js          read check only, changes nothing
//   node check-supabase.js --write  also adds one test row, then tries to remove it

const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "db.js"), "utf8");
const url = source.match(/SUPABASE_URL = "(.+?)"/)?.[1];
const key = source.match(/SUPABASE_PUBLISHABLE_KEY = "(.+?)"/)?.[1];

if (!url || !key || url.includes("YOUR-PROJECT-ID") || key.includes("YOUR-PUBLISHABLE-KEY")) {
  console.error("FAIL  db.js doesn't have a real Project URL and key yet.");
  process.exit(1);
}

const table = `${url}/rest/v1/recipes`;
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function request(pathAndQuery, options = {}) {
  const response = await fetch(table + pathAndQuery, { ...options, headers: { ...headers, ...options.headers } });
  const text = await response.text();
  let body = text;
  try { body = JSON.parse(text); } catch {}
  return { ok: response.ok, status: response.status, body };
}

const reason = result => `HTTP ${result.status}: ${result.body?.message || JSON.stringify(result.body)}`;

async function checkRead() {
  const result = await request("?select=id,name,ingredients,cook_time");
  if (!result.ok) {
    console.log(`FAIL  Read: ${reason(result)}`);
    return false;
  }
  const rows = result.body;
  console.log(`PASS  Read: ${rows.length} row(s) returned.`);
  if (!rows.length) console.log("WARN  An empty result can also mean no read policy allows this key to see rows.");
  const badRows = rows.filter(row => !Array.isArray(row.ingredients));
  if (badRows.length) console.log(`WARN  ${badRows.length} row(s) store ingredients as text, not a list. Search will fail.`);
  return true;
}

async function checkWrite() {
  const testRow = { name: "__connection_test__", ingredients: ["test ingredient"], cook_time: 1 };
  const inserted = await request("?select=id", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(testRow)
  });
  if (!inserted.ok) {
    console.log(`FAIL  Write: ${reason(inserted)}`);
    return false;
  }
  const id = inserted.body[0].id;
  console.log(`PASS  Write: test row added with id ${id}.`);

  const readBack = await request(`?select=id&id=eq.${id}`);
  const found = readBack.ok && readBack.body.length === 1;
  console.log(found ? "PASS  Read back: test row found." : `FAIL  Read back: ${reason(readBack)}`);

  // A delete blocked by row level security returns success with no rows, so check what came back.
  const removed = await request(`?id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=representation" } });
  if (removed.ok && removed.body.length === 1) {
    console.log("PASS  Cleanup: test row removed.");
  } else {
    console.log(`WARN  Cleanup: couldn't remove the test row. Delete id ${id} ("${testRow.name}") in the Table Editor.`);
  }
  return found;
}

(async () => {
  const canRead = await checkRead();
  const canWrite = process.argv.includes("--write") ? await checkWrite() : null;
  if (canWrite === null) console.log("SKIP  Write: run with --write to test it. This adds one test row.");
  process.exitCode = canRead && canWrite !== false ? 0 : 1;
})().catch(err => {
  console.error(`FAIL  Couldn't reach Supabase: ${err.message}`);
  process.exitCode = 1;
});
