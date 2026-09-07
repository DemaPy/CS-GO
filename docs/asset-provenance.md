# Asset provenance

Every model that reaches `public/` must have a passing Step 0 gate recorded here.
A listing's stated license is not evidence. Run the inspector and read the names:

```bash
python3 tools/fbx_inspect.py <candidate>.fbx
```

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
