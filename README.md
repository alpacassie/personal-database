# Personal Database

A little Flask site for personal databases. Right now it displays my reading
list — books, essays, tweets, podcasts, videos — pulled **live from Supabase**
and laid out as a simple table. Add a row to the `personal.reading` table in
Supabase and it shows up here automatically through the public
`personal.reading_room_public` view; no code change needed.

## How it works (the 30-second version)

1. `app.py` asks Supabase for every row in `personal.reading_room_public` (one web request).
2. The view exposes only the display columns: title, link, category, date, and notes.
3. The template (`templates/index.html`) draws the table.

The connection uses a **public, read-only key** — it can only *read* the
public reading-room view, not write to the underlying table.

## Run it locally

```bash
cd personal-database
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Then open <http://localhost:5001>.

## Files

| File | What it does |
|------|--------------|
| `app.py` | Fetches reading data from Supabase |
| `templates/base.html` | The page shell (fonts, `<head>`) |
| `templates/index.html` | The reading table |
| `static/css/style.css` | The simple table styling |
| `vercel.json` | Config for deploying to Vercel |
