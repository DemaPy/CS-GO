import struct, sys, zlib
from collections import defaultdict

PATH = sys.argv[1]
data = open(PATH, 'rb').read()
version = struct.unpack('<I', data[23:27])[0]
print(f"FBX version {version}, {len(data)} bytes\n")

# 7500+ uses 64-bit offsets
w = 8 if version >= 7500 else 4
wf = '<Q' if w == 8 else '<I'

def read_prop(buf, i):
    t = chr(buf[i]); i += 1
    if t == 'Y': return struct.unpack_from('<h', buf, i)[0], i+2
    if t == 'C': return bool(buf[i]), i+1
    if t == 'I': return struct.unpack_from('<i', buf, i)[0], i+4
    if t == 'F': return struct.unpack_from('<f', buf, i)[0], i+4
    if t == 'D': return struct.unpack_from('<d', buf, i)[0], i+8
    if t == 'L': return struct.unpack_from('<q', buf, i)[0], i+8
    if t in 'fdlib':
        n, enc, cl = struct.unpack_from('<III', buf, i); i += 12
        raw = buf[i:i+cl]; i += cl
        if enc == 1: raw = zlib.decompress(raw)
        fmt = {'f':'f','d':'d','l':'q','i':'i','b':'b'}[t]
        return ('ARRAY', t, n, struct.unpack_from('<%d%s' % (n, fmt), raw, 0)), i
    if t in 'SR':
        ln = struct.unpack_from('<I', buf, i)[0]; i += 4
        v = buf[i:i+ln]; i += ln
        return (v.decode('utf-8', 'replace') if t == 'S' else v), i
    raise ValueError(f"unknown prop type {t!r} at {i}")

def parse(buf, start, end):
    nodes = []
    i = start
    while i < end:
        eo = struct.unpack_from(wf, buf, i)[0]
        np_ = struct.unpack_from(wf, buf, i+w)[0]
        pl = struct.unpack_from(wf, buf, i+2*w)[0]
        nl = buf[i+3*w]
        if eo == 0: break
        name = buf[i+3*w+1:i+3*w+1+nl].decode('utf-8', 'replace')
        j = i+3*w+1+nl
        props = []
        for _ in range(np_):
            v, j = read_prop(buf, j)
            props.append(v)
        children = parse(buf, j, eo-13) if j < eo-13 else []
        nodes.append({'name': name, 'props': props, 'children': children})
        i = eo
    return nodes

root = parse(data, 27, len(data))
top = {n['name']: n for n in root}
print("Top-level sections:", list(top.keys()), "\n")

# --- Objects ---
objs = top.get('Objects', {}).get('children', [])
kinds = defaultdict(list)
by_id = {}
for o in objs:
    p = o['props']
    oid = p[0] if p else None
    nm = p[1].split('\x00')[0] if len(p) > 1 and isinstance(p[1], str) else '?'
    sub = p[2] if len(p) > 2 else ''
    kinds[o['name']].append((oid, nm, sub))
    by_id[oid] = (o['name'], nm, sub, o)

print("=== Object counts by type ===")
for k, v in sorted(kinds.items(), key=lambda x: -len(x[1])):
    print(f"  {k:20s} {len(v)}")

print("\n=== Models (scene objects) ===")
for oid, nm, sub in kinds.get('Model', []):
    print(f"  [{sub:12s}] {nm}")

print("\n=== Geometry (meshes) ===")
tot_v = tot_t = 0
for oid, nm, sub in kinds.get('Geometry', []):
    node = by_id[oid][3]
    nv = npi = 0
    for c in node['children']:
        if c['name'] == 'Vertices' and c['props']:
            a = c['props'][0]
            if isinstance(a, tuple) and a[0] == 'ARRAY': nv = a[2] // 3
        if c['name'] == 'PolygonVertexIndex' and c['props']:
            a = c['props'][0]
            if isinstance(a, tuple) and a[0] == 'ARRAY':
                idx = a[3]
                npi = sum(1 for x in idx if x < 0)  # negative marks polygon end
                ncorner = a[2]
    tris = (ncorner - 2 * npi) if npi else 0
    tot_v += nv; tot_t += tris
    print(f"  {nm or '(unnamed)':30s} verts={nv:7d}  polys={npi:6d}  tris≈{tris:7d}")
print(f"\n  TOTAL: verts={tot_v}  tris≈{tot_t}")

# --- Materials / textures ---
print("\n=== Materials ===")
for oid, nm, sub in kinds.get('Material', []):
    print(f"  {nm}")
print("\n=== Textures / Videos ===")
for k in ('Texture', 'Video'):
    for oid, nm, sub in kinds.get(k, []):
        print(f"  [{k}] {nm}")

# --- Deformers = rigging ---
print("\n=== Deformers (skinning/rig) ===")
d = kinds.get('Deformer', [])
print(f"  {len(d)} deformer(s)" + (" -> NOT rigged" if not d else ""))
for oid, nm, sub in d:
    print(f"  [{sub}] {nm}")

# --- Animation ---
print("\n=== Animation ===")
for k in ('AnimationStack', 'AnimationLayer', 'AnimationCurveNode', 'AnimationCurve'):
    print(f"  {k}: {len(kinds.get(k, []))}")
