# Personal Database

A little Flask site for personal databases. It displays public, display-only
views from Supabase for Reading, Wardrobe, Recipes, Media, and Sake.

## How it works (the 30-second version)

1. `app.py` asks Supabase for each public view.
2. Each view exposes only display columns, not the full private table.
3. The template (`templates/index.html`) draws an index and section tables.

The connection uses a **public, read-only key** — it can only *read* the
public views, not write to the underlying tables.

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
| `app.py` | Fetches each public personal-database view from Supabase |
| `templates/base.html` | The page shell (fonts, `<head>`) |
| `templates/index.html` | The overview cards and section tables |
| `static/css/style.css` | The page layout and table styling |
| `vercel.json` | Config for deploying to Vercel |
