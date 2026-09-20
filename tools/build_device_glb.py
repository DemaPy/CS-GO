"""Build `public/models/c4-device.glb` from the Sketchfab "C4 bomb | CS2" download.

The GLB is gitignored (it is 2.4 MB of someone else's art), so this script is
what makes it reproducible. Nothing else in the repo can rebuild the model.

    /Applications/Blender.app/Contents/MacOS/Blender --background \
      --factory-startup --python tools/build_device_glb.py -- \
      <download>/source/C4_bomb.fbx <download>/textures \
      public/models/c4-device.glb 1024

What it does, and why each step exists:

1. The FBX is two meshes — a 17.9k-triangle welded body and a 12-triangle LCD
   plane. `AssemblyRig` needs five independently movable groups, so the body is
   split into its 430 loose parts and reassembled into `casing`, `charges`,
   `harness`, `panel` and `arm`.
2. Parts are classified by where they sit and what colour the albedo is at
   their UVs. Geometry alone cannot tell tape from explosive (both sit in the
   lower slab); colour alone cannot tell a red cable from a red switch. The two
   together can.
3. `charges` becomes an empty with three brick meshes under it, because
   `splitIntoPivots` in gltf-rig.ts gives each child its own pivot — which is
   what lets the three bricks converge from three directions.
4. Everything is rotated so the long axis ends up on glTF +Y and the face on
   glTF +Z, scaled so the longest dimension is 250, and has its transform
   applied. No node may carry a scale: gltf-rig.ts warns about exactly that,
   because a residual scale on DisplayAnchor destabilises the readout.
5. `DisplayAnchor` is measured off the LCD plane after all transforms, so the
   readout lands on the device's own screen.
6. Textures are resized and exported as JPEG. The same maps exported losslessly
   make a 28 MB GLB; at 1k/JPEG-85 the whole model is 2.4 MB.

Licence: CC Attribution. "C4 bomb | CS2" by Alex. See docs/asset-provenance.md
— the attribution is a condition of use and has to appear on the site.
"""

import bpy, sys, os, json, colorsys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
FBX, TEXDIR, OUT, TEXSIZE = argv[0], argv[1], argv[2], int(argv[3])

# The scene is authored in millimetres (see REFERENCE_BOUNDS), longest axis 250.
TARGET_LONGEST = 250.0
BRICK_TOP_Z = 0.019          # top of the explosive slab, metres, model space
# The red arming switch and its cable, as a box in model space. Measured off
# the parts dump, not guessed: the switch's red faces sit at x 0.044-0.095,
# y 0.033-0.086, and nothing else on the deck reaches past x 0.04 — the board,
# keypad and LCD all live at x < 0.03. Too tight a box (the first attempt used
# x > 0.075, y > 0.045) catches two 26mm scraps and leaves the switch body in
# `harness`, which then seats it three stages early.
ARM_REGION = (0.040, 0.030)  # x >, y >

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def wbox(o):
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    mx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    return mn, mx

def activate(obs, active=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or obs[0]

reset()
bpy.ops.import_scene.fbx(filepath=FBX)

lcd = bpy.data.objects['controlpanel0_c4_panorama_control_panel']
body = bpy.data.objects['body_hd_weapon_c4']

activate([body])
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='LOOSE')
bpy.ops.object.mode_set(mode='OBJECT')

# ── colour per part, sampled from the albedo at low resolution ──────────────
img = bpy.data.images.load(os.path.join(TEXDIR, 'c4_color_tga_75da6dec.png'))
N = 256
img.scale(N, N)
px = list(img.pixels)

def avg_colour(o):
    uv = o.data.uv_layers.active
    if not uv:
        return (0.0, 0.0, 0.0)
    r = g = b = 0.0; n = 0
    for poly in o.data.polygons[:40]:
        cu = cv = 0.0
        for li in poly.loop_indices:
            a = uv.data[li].uv
            cu += a[0]; cv += a[1]
        k = len(poly.loop_indices)
        x = int((cu / k % 1.0) * (N - 1)); y = int((cv / k % 1.0) * (N - 1))
        i = (y * N + x) * 4
        r += px[i]; g += px[i+1]; b += px[i+2]; n += 1
    return (r/n, g/n, b/n) if n else (0.0, 0.0, 0.0)

parts = [o for o in bpy.data.objects if o.type == 'MESH' and o is not lcd]

# ── three brick bands, from the two intact end bricks ───────────────────────
BRICK_BANDS = [(0.0216, 0.0759), (-0.0321, 0.0219), (-0.0858, -0.0315)]

def band_of(y):
    for i, (lo, hi) in enumerate(BRICK_BANDS):
        if lo <= y <= hi:
            return i
    return min(range(3), key=lambda i: abs(y - sum(BRICK_BANDS[i]) / 2))

groups = {'casing': [], 'harness': [], 'panel': [], 'arm': []}
bricks = [[], [], []]

for o in parts:
    mn, mx = wbox(o)
    c = (mn + mx) / 2
    r, g, b = avg_colour(o)
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    hue = h * 360

    if c.z < BRICK_TOP_Z:
        # The explosive slab. Tan is charge; anything grey down here is the
        # tape strapping and the backing sheet that hold the bricks together.
        if 15 <= hue < 60 and s > 0.30:
            bricks[band_of(c.y)].append(o)
        else:
            groups['casing'].append(o)
    else:
        # The electronics deck.
        if c.x > ARM_REGION[0] and c.y > ARM_REGION[1]:
            groups['arm'].append(o)
        elif s > 0.50 and v > 0.12:
            groups['harness'].append(o)   # saturated red / yellow cable runs
        else:
            groups['panel'].append(o)


print('CLASSIFIED', json.dumps({k: len(v) for k, v in groups.items()}),
      'bricks', [len(b) for b in bricks])

def join(obs, name):
    obs = [o for o in obs if o.name in bpy.data.objects]
    activate(obs, obs[0])
    if len(obs) > 1:
        bpy.ops.object.join()
    merged = bpy.context.view_layer.objects.active
    merged.name = name
    return merged

sections = {}
for key in ('casing', 'harness', 'panel', 'arm'):
    sections[key] = join(groups[key], key)

brick_objs = [join(bricks[i], f'charge_{i+1}') for i in range(3)]

# ── orientation and units ──────────────────────────────────────────────────
# The scene wants the device's long axis UP (REFERENCE_BOUNDS.y = 250) and its
# face toward the camera (+Z). The model has the long axis on X and the face on
# +Z, and glTF is Y-up while Blender is Z-up — the exporter rewrites
# (bx, by, bz) as (bx, bz, -by). Authoring for Blender's axes and forgetting
# that rewrite lays the device flat, face to the sky, pointing away from the
# lens.
#
# So solve in glTF terms and work backwards. Wanted: long axis -> glTF Y,
# face -> glTF Z. That needs long axis -> Blender Z and face -> Blender -Y.
# The rotation taking model X -> Z and model Z -> -Y is Rz(90) . Ry(-90),
# which is Blender's XYZ Euler (0, -pi/2, pi/2).
#
#   model X (0.268 long)  ->  Blender Z  ->  glTF  Y = 250   up
#   model Y (0.189)       ->  Blender -X ->  glTF  X = 177   across
#   model Z (0.083 face)  ->  Blender -Y ->  glTF  Z =  78   toward camera
longest = max(max(wbox(o)[1] - wbox(o)[0]) for o in
              list(sections.values()) + brick_objs)
scale = TARGET_LONGEST / longest

# The LCD plane stays its own object until the anchor has been placed on it —
# joining it into `panel` first is what put the anchor at the world origin.
meshes = list(sections.values()) + brick_objs + [lcd]
for o in meshes:
    o.rotation_euler = (0, -math.pi / 2, math.pi / 2)
    o.scale = (scale, scale, scale)
activate(meshes)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

# Centre the whole device on the origin, then give every part its own pivot.
mn = Vector((1e18,)*3); mx = Vector((-1e18,)*3)
for o in meshes:
    a, b2 = wbox(o)
    mn = Vector((min(mn.x,a.x), min(mn.y,a.y), min(mn.z,a.z)))
    mx = Vector((max(mx.x,b2.x), max(mx.y,b2.y), max(mx.z,b2.z)))
centre = (mn + mx) / 2
for o in meshes:
    o.location -= centre
activate(meshes)
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

for o in meshes:
    activate([o])
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

# ── the charges group: an empty holding the three bricks ───────────────────
charges = bpy.data.objects.new('charges', None)
bpy.context.collection.objects.link(charges)
charges.empty_display_size = 0.01
for o in brick_objs:
    o.parent = charges
    o.matrix_parent_inverse = charges.matrix_world.inverted()

# ── the display anchor, measured off the LCD once it is in final units ─────
# Read from the transformed plane rather than reconstructed from model-space
# coordinates: the rotation, the scale and the recentring all have to agree,
# and asking the object where it ended up cannot disagree with itself.
lcd_mn, lcd_mx = wbox(lcd)
lcd_centre = (lcd_mn + lcd_mx) / 2

anchor = bpy.data.objects.new('DisplayAnchor', None)
bpy.context.collection.objects.link(anchor)
anchor.empty_display_size = 0.01
anchor.parent = sections['panel']
anchor.matrix_parent_inverse = sections['panel'].matrix_world.inverted()
# Just clear of the screen face, so the readout never z-fights with it.
# Outward is Blender -Y here, because that is where the rotation above put the
# model's face normal — offsetting along Blender +Z would slide the anchor
# along the device's long axis instead of lifting it off the screen.
anchor.location = Vector((lcd_centre.x, lcd_mn.y - 0.5, lcd_centre.z))

# The screen belongs to the panel group now that the anchor is placed.
lcd.parent = sections['panel']
lcd.matrix_parent_inverse = sections['panel'].matrix_world.inverted()
print('LCD size', tuple(round(v, 2) for v in (lcd_mx - lcd_mn)))

# ── textures, resized so the GLB is shippable ──────────────────────────────
def load(name):
    im = bpy.data.images.load(os.path.join(TEXDIR, name))
    im.scale(TEXSIZE, TEXSIZE)
    return im

col = load('c4_color_tga_75da6dec.png')
rgh = load('c4_rough_tga_53c5f087.png')
nrm = load('c4_normal_tga_4e48d437.png')
rgh.colorspace_settings.name = 'Non-Color'
nrm.colorspace_settings.name = 'Non-Color'

for mat in bpy.data.materials:
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not bsdf:
        continue
    if mat.name.startswith('c4_panorama'):
        # The screen itself. Left untextured on purpose: the readout is a real
        # DOM input in front of it, and gltf-rig paints untextured materials.
        bsdf.inputs['Base Color'].default_value = (0.02, 0.03, 0.01, 1)
        bsdf.inputs['Roughness'].default_value = 0.35
        continue
    for image, socket in ((col, 'Base Color'), (rgh, 'Roughness')):
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = image
        nt.links.new(tex.outputs['Color'], bsdf.inputs[socket])
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = nrm
    nmap = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(tex.outputs['Color'], nmap.inputs['Color'])
    nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Metallic'].default_value = 0.0

for o in meshes:
    a, b2 = wbox(o)
    print(f'PART {o.name:<10} pivot={tuple(round(v,2) for v in o.location)} '
          f'size={tuple(round(v,2) for v in (b2-a))} scale={tuple(round(v,4) for v in o.scale)}')
bpy.context.view_layer.update()
print('ANCHOR world', tuple(round(v, 2) for v in anchor.matrix_world.translation),
      'scale', tuple(round(v, 4) for v in anchor.matrix_world.to_scale()))

bpy.ops.object.select_all(action='SELECT')
# JPEG, not PNG: the same 1k maps exported losslessly make a 28MB GLB, which
# is not a landing-page asset. Quality 85 on a device this size is invisible.
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    use_selection=False,
    export_image_format='JPEG',
    export_jpeg_quality=85,
)
print('EXPORTED', OUT, os.path.getsize(OUT))
