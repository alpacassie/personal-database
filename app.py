"""A simple Flask site for public personal-database views from Supabase."""

import os

import requests
from flask import Flask, render_template

app = Flask(__name__)

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL",
    "https://dxgfcxdlxuruvdyaulfj.supabase.co",
)
SUPABASE_SCHEMA = os.environ.get("SUPABASE_SCHEMA", "personal")
SUPABASE_KEY = os.environ.get(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Z2ZjeGRseHVydXZkeWF1bGZqIiwicm9sZSI6"
    "ImFub24iLCJpYXQiOjE3Njc1NTQ0MTgsImV4cCI6MjA4MzEzMDQxOH0."
    "PDLsQxbE5rPOs4-IR64UYAjinihyys8ASPibMQhjJK0",
)

SECTIONS = {
    "reading": {
        "label": "Reading",
        "source": "reading_room_public",
        "select": "title,link,category,date,notes",
        "columns": ["title", "category", "date", "notes"],
    },
    "wardrobe": {
        "label": "Wardrobe",
        "source": "wardrobe_public",
        "select": "name,product_name,brand,capsule,type,category,color,product_url,image_url",
        "columns": ["name", "brand", "type", "capsule"],
    },
    "recipes": {
        "label": "Recipes",
        "source": "recipes_public",
        "select": "name,details",
        "columns": ["name", "details"],
    },
    "media": {
        "label": "Media",
        "source": "media_public",
        "select": "name,type,watched,rating,year,link,notes",
        "columns": ["name", "type", "watched", "rating"],
    },
    "sake": {
        "label": "Sake",
        "source": "sake_public",
        "select": "name,type,status,flavor,price_usd,japanese_name,english_name,category,description",
        "columns": ["name", "category", "status", "flavor"],
    },
}


def fetch_view(source, select):
    """Fetch rows from a display-only Supabase view."""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/{source}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept-Profile": SUPABASE_SCHEMA,
        },
        params={"select": select},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


@app.route("/")
def index():
    sections = {}
    for key, config in SECTIONS.items():
        rows = fetch_view(config["source"], config["select"])
        sections[key] = {**config, "rows": rows, "total": len(rows)}
    return render_template("index.html", sections=sections)


if __name__ == "__main__":
    app.run(debug=True, port=5001)
