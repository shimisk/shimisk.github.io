"""
Valheim Companion — build.py
----------------------------
Whenever you edit a JSON file in /data/, run this script to
re-inline the data into valheim-companion.jsx:

    python3 build.py

That's it. No other changes needed.
"""
import json, re

files = ['bosses','weapons','armor','food','materials','vendors']
data  = {f: json.load(open(f'data/{f}.json', encoding='utf-8')) for f in files}

# Build inlined constants block
lines = [
  '// ─── Inlined game data ────────────────────────────────────────────────────────',
  '// These constants are auto-generated from the /data/*.json files.',
  '// To update: edit the JSON file, then run: python3 build.py',
  '// DO NOT edit these constants directly — edit the JSON files instead.',
  '',
]
for f in files:
    compact = json.dumps(data[f], separators=(',',':'), ensure_ascii=False)
    lines.append(f'const _{f.upper()}_DATA = {compact};')

lines += [
  '',
  'function useGameData() {',
  '  const allItems = [',
  '    ...(_WEAPONS_DATA.items   || []),',
  '    ...(_FOOD_DATA.items      || []),',
  '    ...(_MATERIALS_DATA.items || []),',
  '  ];',
  '  const data = {',
  '    bosses:   _BOSSES_DATA,',
  '    weapons:  _WEAPONS_DATA,',
  '    armor:    _ARMOR_DATA,',
  '    food:     _FOOD_DATA,',
  '    materials:_MATERIALS_DATA,',
  '    vendors:  _VENDORS_DATA,',
  '    allItems,',
  '  };',
  '  return { data, loading: false, error: null };',
  '}',
]
new_block = '\n'.join(lines)

with open('valheim-companion.jsx', encoding='utf-8') as f:
    app = f.read()

# Replace the inlined block
app = re.sub(
    r'// ─── Inlined game data ─.*?^}',
    new_block,
    app,
    flags=re.DOTALL | re.MULTILINE
)

with open('valheim-companion.jsx', 'w', encoding='utf-8') as f:
    f.write(app)

print("✓ valheim-companion.jsx updated from JSON files")
for fn in files:
    d = data[fn]
    items = d if isinstance(d, list) else next((v for v in d.values() if isinstance(v, list)), [])
    print(f"  {fn}.json → {len(items)} entries")
