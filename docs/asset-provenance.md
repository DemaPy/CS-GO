# Asset provenance

Every model that reaches `public/` must have a passing Step 0 gate recorded here.
A listing's stated license is not evidence. Run the inspector and read the names:

```bash
python3 tools/fbx_inspect.py <candidate>.fbx
```

---

## ACCEPTED — `C4_bomb.fbx` — "C4 bomb | CS2" by Alex (2026-09-20)

**Status:** shipping asset. Built into `public/models/c4-device.glb` by
`tools/build_device_glb.py`. The GLB is gitignored; the script is the record.

**Licence, as the download dialog states it:** CC Attribution — "Author must be
credited. Commercial use is allowed." Credit string offered by Sketchfab:
*"C4 bomb | CS2" by Alex is licensed under Creative Commons Attribution.*

> **The attribution is a condition, not a courtesy.** CC-BY permits the
> commercial use this landing page makes of it *only while* the credit is
> displayed. Nothing on the site carries it yet. Until it does, the page is
> using the asset outside its licence — see "Outstanding" below.

**Naming.** The internal names are Valve's: `body_hd_weapon_c4`,
`weapon_c4`, `controlpanel0_c4_panorama_control_panel`, and the albedo reads
"DEMOLITION CHARGE / TNT EQUIVALENT". Gate 0.2 as written rejects this, and it
rejected the earlier `C4-1.fbx` on the same evidence. The project owner
reviewed that and decided the listing's licence grant governs: the naming is
the uploader's problem, the download is free and the grant is explicit. Recorded
here as a decision, not an oversight, so the next person reading gate 0.2 knows
it was seen and answered rather than missed.

**Inspector output, 2026-09-20:**

```
FBX version 7400, 664796 bytes

=== Object counts by type ===
  Geometry             2
  Model                2
  Material             2

=== Models (scene objects) ===
  [Mesh        ] body_hd_weapon_c4
  [Mesh        ] controlpanel0_c4_panorama_control_panel

=== Geometry (meshes) ===
  body_hd_weapon_c4_mesh         verts=  14371  polys= 17937  tris≈  17937
  controlpanel0_c4_panorama_control_panel_mesh verts=     24  polys=    12

  TOTAL: verts=14395  tris≈17949

=== Deformers (skinning/rig) ===
  0 deformer(s) -> NOT rigged

=== Animation ===
  AnimationStack: 0
```

| Gate | Result | Evidence |
|---|---|---|
| 0.2 Provenance | **WAIVED** | Valve-derived naming, CC-BY grant on the listing. Owner's decision, above. |
| 0.3 Split | **PASS** | 430 loose parts, grouped into the five `SectionId` sets. |
| 0.4 Close-up | **PASS** | 17,937 triangles, with 4k colour / normal / roughness / AO maps. |

**Textures shipped:** colour, roughness and normal, resized to 1024 and exported
as JPEG-85. AO is not wired — glTF occlusion needs a separate channel and the
scene's lighting does not call for it. Lossless PNG at the same resolution
makes a 28 MB GLB; this is 2.4 MB.

### Measured, as built

As imported: 0.2678 x 0.1893 x 0.0832 m — longest 26.8 cm, inside Step 3.2's
0.2–0.3 m target with no correction factor. This is the first candidate that did
not import at the wrong scale.

The build rotates the long axis onto glTF +Y and the face onto +Z, then scales
by 933.5 so the longest dimension is 250 in the scene's millimetre units:

| Axis | Built (scene units) | `REFERENCE_BOUNDS` |
|---|---|---|
| x | 177 | 165.5 |
| y | 250 | 250 |
| z | 78 | 81.4 |

`REFERENCE_BOUNDS` was a framing approximation taken from the rejected asset.
The real device is within 7% of it on every axis, so the camera path, the
placeholder's proportions and the Section 5 framing all stand unchanged.

### How the 430 parts were grouped

| Group | Rule | Parts |
|---|---|---|
| `charges` | below the slab top (z < 0.019), tan (hue 15–60, sat > 0.3), bucketed into three brick bands by y | 5 / 6 / 6 |
| `casing` | below the slab top, not tan — the tape strapping, the backing sheet and the detonator leads | 69 |
| `arm` | on the deck, inside the switch box (x > 0.040, y > 0.030) — the red arming switch and its cable | 20 |
| `harness` | on the deck, saturated (sat > 0.5) — the red, yellow and black cable runs | 35 |
| `panel` | everything else on the deck — board, keypad, components, and the LCD plane | 288 |

The three brick bands are `y` ∈ [0.0216, 0.0759], [-0.0321, 0.0219],
[-0.0858, -0.0315], measured from the two intact end bricks. The middle brick is
fragmented into faces and caps in the source, which is why bands are used rather
than loose-part identity.

`DisplayAnchor` is measured off the LCD plane *after* the transforms, not
reconstructed from model-space coordinates — the rotation, the scale and the
recentring all have to agree, and asking the object where it ended up cannot
disagree with itself. The screen is 72 x 18 scene units, landscape, which is
close to the readout shell's 87.6 x 28.3; the shell currently overhangs the
bezel slightly.

### Outstanding

- ~~The CC-BY credit is not on the site.~~ **Done.** `src/components/Credits.tsx`
  pins it to the bottom of the viewport in all three render branches, outside
  the `<Canvas>` so the scrub cannot move it off screen. The strings live in
  `src/content/credits.ts`. One gap remains: the Sketchfab listing URL is not
  recorded, so the credit names the work and author but does not link to the
  work. Paste the URL into `CREDITS[0].href` and it links.
- The readout shell overhangs the model's LCD bezel. Tuning `<Html scale>` in
  `DisplayPanel` from 14.6 toward ~12 would seat it inside the screen.
- `charge_3` is 250 units long against its siblings' 226 — it has picked up a
  full-length part that belongs in `casing`.

---

## REJECTED — `C4-1.fbx` (Sketchfab `617d7546…`)

**Status:** local development placeholder only. Never commit, never deploy.
Retained solely as a silhouette and camera-framing reference (plan Step 3).
Lives at `.local/c4-explosive/`, which is gitignored.

**Inspector output, 2026-09-07, verbatim:**

```
FBX version 7400, 194252 bytes

Top-level sections: ['FBXHeaderExtension', 'FileId', 'CreationTime', 'Creator',
'GlobalSettings', 'Documents', 'References', 'Definitions', 'Objects',
'Connections', 'Takes']

=== Object counts by type ===
  Geometry             1
  Model                1
  Material             1
  Texture              1
  Video                1

=== Models (scene objects) ===
  [Mesh        ] models/weapons/w_eq_c4.001

=== Geometry (meshes) ===
  models/weapons/w_eq_c4.056     verts=   2400  polys=  4020  tris≈   4020

  TOTAL: verts=2400  tris≈4020

=== Materials ===
  materials/models/weapons/w_models/w_c4/c4

=== Textures / Videos ===
  [Texture] specular_texture
  [Video] models/weapons/w_models/w_c4/c4.png

=== Deformers (skinning/rig) ===
  0 deformer(s) -> NOT rigged

=== Animation ===
  AnimationStack: 0
  AnimationLayer: 0
  AnimationCurveNode: 0
  AnimationCurve: 0
```

**Gate results:**

| Gate | Result | Evidence |
|---|---|---|
| 0.2 Provenance | **FAIL** | `models/weapons/w_eq_c4`, `materials/models/weapons/w_models/w_c4/c4`, `c4.png`. Source engine asset-tree pathing with a `w_` prefix. Decompiled Valve asset; the listing's CC-Attribution grant is void because the uploader had no right to grant it. |
| 0.3 Split | **FAIL** | 1 mesh object. Needs ≥ 5 separately named meshes mapping to the `SectionId` groups. |
| 0.4 Close-up | **FAIL** | 4,020 triangles. Needs ~15k — the Section 5 camera fills the frame with the panel. |

The description claimed original Blender/Substance work. The file disagrees. This
is the second candidate to pass the license field and fail on names, matching the
pattern in plan Step 0.7: free CS2-derived C4 models are the same decompiled
Valve asset re-uploaded.

**Do not run `P → By Loose Parts` on this mesh** (Step 3.5). A game world model
is authored as one continuous welded surface, so the operation returns one object.

### Bounding box — measured 2026-09-07 (Step 3.2, 3.3)

Measured headless in Blender 5.2.1 LTS, factory startup, empty scene so the
default cube/camera/light could not pollute the bounds:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python measure.py -- .local/c4-explosive/source/C4-1.fbx
```

**As imported** — scene units METRIC, `scale_length=1.0`, object scale `(1,1,1)`:

| Axis | Imported (m) |
|---|---|
| x | 7.163635 |
| y | 10.813313 |
| z | 3.523108 |

Longest dimension **10.81 m** against Step 3.2's 0.2–0.3 m target. This is
exactly the misread-unit-metadata failure that step predicts — the model imports
roughly 43× too large.

**Correction factor: `0.0231`** on all three axes, landing the longest dimension
at 0.25 m, the midpoint of the target range.

**Corrected dimensions — these are the numbers Step 4's placeholder boxes are
sized against, and the space Step 5.4's camera path lives in:**

| Axis | Corrected (m) |
|---|---|
| x | 0.1655 |
| y | 0.2500 |
| z | 0.0814 |

> **The aspect ratio is unverified.** 7.16 : 10.81 : 3.52 normalizes to
> 0.66 : 1 : 0.33, which matches neither an M112 demolition charge
> (0.18 : 1 : 0.14) nor obviously a satchel. Only the longest-dimension sanity
> check from Step 3.2 has been satisfied. The ratio is taken from the reference
> as-is and is a **framing approximation, not a real-world measurement**. If the
> shipped device turns out to be a different shape, Step 5.4's camera path is
> what breaks — this note is what makes that diagnosable.

### Step 3.5 is wrong — corrected 2026-09-07

The plan states that `P → By Loose Parts` on this mesh "returns one object and
the time is wasted," because a game world model is authored as one continuous
welded surface. **This is false for this asset.** Measured by walking edge
connectivity directly rather than trusting the claim:

```
connected components (loose parts): 56
```

56, not 1. The "one continuous welded surface" premise does not hold for this
asset class, and the stated reasoning would misinform the same check on a future
candidate.

Splitting *this* file is still pointless — but on the real reason: gate 0.2
rejects it on provenance regardless of how cleanly it splits. Keep that
distinction, because it is what stops a future candidate being waved past on the
strength of a good loose-parts count.

---

## PENDING — candidate from Sketchfab download dialog (2026-09-07)

Listing not yet identified. The dialog offered FBX as the **original** format at
5 MB, plus converted USDZ / glTF / GLB. Note the plan records the H.Reyes
candidate as `.blend`-only, so either this is a different listing or that note is
stale.

**Inspect the original `.fbx`, not a converted format.** Sketchfab's conversions
rename and merge objects, destroying the authored names that gate 0.2 reads.

Awaiting: the `.fbx` file, the listing URL, and the **COPY CREDITS** output from
the download dialog (Step 0.5 — use the licensor's string verbatim rather than
composing one).

If the license is informal — a description sentence rather than a named license —
Step 0.6 requires written permission naming commercial use on a paid landing page
before the asset enters `public/`. Record the permission text here.

---

## Not yet evaluated

- **ninashaw, C4 Explosive with Detonator** — paid, royalty-free, listing claims
  logically-named grouped objects.
- **Commission** (plan Step 10b) — the fallback per Step 0.7. Do not spend more
  than two candidates' worth of effort on free assets.
