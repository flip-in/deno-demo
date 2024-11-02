import { Database } from "jsr:@db/sqlite@0.11";
import * as _std_text from "@std/text";

const db = new Database("horses.db");
db.exec(`
  DROP TABLE IF EXISTS horses;
  CREATE TABLE horses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    permalink TEXT
  );
`);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const id = path.split("/")[2];

  if (path === "/") {
    const html = await Deno.readFile("./static/index.html");
    return new Response(html, {
      headers: { "content-type": "text/html" },
    });
  }

  if (!path.startsWith("/horse")){
    return new Response("Not Found", {status: 404});
  }

  if (req.method === "GET" && !id){
    const horses = db.prepare("SELECT * FROM horses").all();
    return new Response(JSON.stringify(horses), {
      headers: {"content-type": "application/json"},
      status: horses.length ? 200 : 404,
    });
  }

  if (req.method === "GET" && id){
    const horse = db.prepare("SELECT * FROM horses WHERE id = :id").get({id});
    return new Response(JSON.stringify(horse), {
      headers: {"content-type": "application/json"},
      status: 200,
    });
  }

  if (req.method === "POST") {
    try {
      const { name, age } = await req.json();

      const permalink = "horsetider.dev/" + _std_text.toKebabCase(name);

      const horse = db.prepare(
        "INSERT INTO horses (name, age, permalink) VALUES (?, ?, ?) RETURNING *",
      )
      .get([name, age, permalink]);

      return new Response(JSON.stringify(horse), {
        status: 201,
        headers: {"content-type": "application/json"},
      });
    } catch (_error) {
      return new Response("Bad Request", { status: 400 });
    }

  }

  return new Response("Method Not Allowed", { status: 405 });
});