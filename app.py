"""
reading-room — a simple Flask page that shows the `reading` table
from Supabase, pulled live, as a plain table.

  1. Ask Supabase for every row in the `reading` table (one web request).
  2. Hand the rows to an HTML template that draws a table.
"""

import os

import requests
from flask import Flask, render_template

app = Flask(__name__)

# Where the data lives. SUPABASE_KEY is a public read-only key for the
# display-only reading-room view.
SUPABASE_URL = os.environ.get(
    "SUPABASE_URL",
    "https://dxgfcxdlxuruvdyaulfj.supabase.co",
)
SUPABASE_SCHEMA = os.environ.get("SUPABASE_SCHEMA", "personal")
SUPABASE_READING_SOURCE = os.environ.get("SUPABASE_READING_SOURCE", "reading_room_public")
SUPABASE_KEY = os.environ.get(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Z2ZjeGRseHVydXZkeWF1bGZqIiwicm9sZSI6"
    "ImFub24iLCJpYXQiOjE3Njc1NTQ0MTgsImV4cCI6MjA4MzEzMDQxOH0."
    "PDLsQxbE5rPOs4-IR64UYAjinihyys8ASPibMQhjJK0",
)


def fetch_reading():
    """Fetch every row from the reading-room view via Supabase's REST API."""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/{SUPABASE_READING_SOURCE}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept-Profile": SUPABASE_SCHEMA,
        },
        params={
            "select": "title,link,category,date,notes",
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


@app.route("/")
def index():
    rows = fetch_reading()
    return render_template("index.html", rows=rows, total=len(rows))


if __name__ == "__main__":
    app.run(debug=True, port=5001)
