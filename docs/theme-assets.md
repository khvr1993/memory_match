# Theme asset conventions

Theme artwork is isolated by theme so one theme's files cannot silently overwrite another's.

## Current layout

| Theme | Asset directory | Notes |
|-------|-----------------|-------|
| Superheroes | `public/heroes/` | JPEG portraits and generated SVG portraits |
| Animals | none | Emoji-only |
| Fruits | none | Emoji-only |
| India | none | Emoji-only |
| Shapes | none | Emoji-only |
| Vehicles | none | Emoji-only |

`src/components/memory/themesData.ts` sets `assetDir: 'heroes'` on the superhero theme.
Every superhero symbol image path must start with `heroes/`.

## Rules for future themes

- A theme with image art gets its own directory: `public/<themeId>/`
  (for example `public/animals/`).
- Set `assetDir: '<themeId>'` on that theme and reference images as
  `<themeId>/<file>`.
- A theme without `assetDir` must not define any `symbol.image`.
- Theme generators must write only to their theme's directory.
- Never add non-superhero art to `public/heroes/`.

The asset-isolation test in `src/components/memory/memory.test.ts` enforces these rules and
checks that every referenced image file exists.
