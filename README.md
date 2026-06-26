# Personal Database

Static source for Cassie's personal database site.

The site opens to Reading and includes tabs for Recipes, Media, Wardrobe,
Wedding, Flowers, and Sake. It uses local fallback data files and fetches live
public data from the alpacassie Supabase Edge Function when available.

## Run locally

```bash
python3 -m http.server 5001
```

Then open <http://127.0.0.1:5001/#reading>.
