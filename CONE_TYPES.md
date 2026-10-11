# Cone types and preview

The game loads `cone-types.json` at startup and when a game starts or restarts. Edit that file to tune the ten cone archetypes. Serve the project over HTTP so the browser can load its modules and JSON:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/` to play or `http://localhost:8000/?preview=cones` to compare cone shapes. The game uses Three.js from a CDN and requires a network connection on first load.

## Preview controls

Select a type and a seed to get a repeatable cone. Motion starts paused. The same type, seed, variation setting, bend, and animation time produce the same pose.

- **Spawn variation** applies the small profile variations used during play. Leave it unchecked to compare the authored dimensions. Seeded lighting and organic surface motion remain visible.
- **Bend** moves from zero to that type's configured maximum bend, even while paused. Types with `BA: 0` disable the slider.
- **Play motion** animates the organic motion; **Pause motion** freezes the pose. The bend remains controlled by the slider.
- **Reload cone JSON** picks up saved edits without reloading the page. Validation details appear below the controls.

The preview uses a center-column heading and a fixed camera. Check final candidates during normal play as well: side columns mirror headings inward, and the gameplay camera has perspective and device-specific framing. Previewing never records scores or saves camera settings.

## Parameter reference

Radius percentages refer to a standard radius of **0.88 scene units**. Height percentages refer to a **2.5-unit centerline** before the cone's overall gameplay scale. Height landmarks are measured from the base, not from the previous segment. A tilted cone's vertical height is shorter than its centerline length.

| Key | Meaning | Allowed value |
| --- | --- | --- |
| `name` | Unique, non-empty type name | String |
| `S1-R` | Radius at the bottom | 1–150% |
| `S1-H` | First absolute height landmark | 0–96% |
| `S2-R` | Radius at `S1-H` | 1–150% |
| `S2-H` | Second absolute height landmark; must be at least 1 percentage point above `S1-H` | 1–99% |
| `S3-R` | Radius at `S2-H` | 1–150% |
| `S3-ER` | Final mouth radius multiplier; `1.1` means 110% | 0.1–4 |
| `OC` | Mouth-center offset toward the lower edge of the aperture plane, relative to the final mouth radius | 0–100% |
| `OR` | Mouth tilt: zero is upright, 90 is sideways | 0–90° |
| `OR-Y` | Mouth heading; side columns mirror its magnitude inward, while the center column preserves its sign | −90–90° |
| `BH` | Bend pivot height; when `BA > 0`, must be at least two percentage points below `S2-H` | 0–95% |
| `BA` | Maximum additional upper-body bend; zero disables bending | 0–90° |
| `BO` | Bend heading offset relative to `OR-Y` | −180–180° |
| `OR-B` | Rotate the mouth with the bend when true; retain its original orientation when false | Boolean |

Normal spawns add small variations to radii, height landmarks, orientation, and bend parameters. They also breathe, sway, and may perform a larger bend. These effects explain differences between an authored profile and individual spawns.

## Validation and fallback

`cone-types.schema.json` supplies editor validation. `cone-config.mjs` validates each profile at runtime, including the relationships between height values and unique names. Every listed profile field is required. Numeric strings, nulls, non-finite numbers, unknown profile keys, and values outside the ranges are rejected rather than silently clamped. Schema version 1 is supported; omitting `schemaVersion` remains compatible.

Valid profiles still load if another profile is invalid. If loading fails or no valid profiles remain, the current page keeps its last valid set. On a fresh page without a valid set, it uses one embedded fallback cone. The preview and browser console report the reason. Normal play shows a brief fallback notice.

Keep `cone-types.json`, `cone-types.schema.json`, `cone-config.mjs`, and `game-support.mjs` with `index.html` when copying or deploying the project.

## Regression checks

Run the dependency-free configuration and lifecycle tests with:

```sh
node --test tests/*.test.mjs
```
