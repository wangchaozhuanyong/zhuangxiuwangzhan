"""Generate lossless glyph subsets from the site's frozen original font URLs.

Offline build tool only; fontTools is not a website runtime dependency.
Unknown/new glyphs keep using the unchanged original font-face declarations.
"""
import argparse
import hashlib
import io
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse

from fontTools import subset
from fontTools.ttLib import TTFont

parser = argparse.ArgumentParser()
parser.add_argument('--corpus', required=True)
parser.add_argument('--source-css', required=True)
parser.add_argument('--output', required=True)
parser.add_argument('--cache', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
output, cache = Path(args.output).resolve(), Path(args.cache).resolve()
for folder in (output, cache):
    if not folder.is_relative_to(root):
        raise ValueError('Font output/cache must stay inside this project')
    folder.mkdir(parents=True, exist_ok=True)
source_css = Path(args.source_css).read_text()
corpus = Path(args.corpus).read_text()
characters = set(map(ord, corpus))


def unicode_points(value):
    result = set()
    for token in value.split(','):
        token = token.strip().upper().removeprefix('U+')
        if '?' in token:
            first, last = token.replace('?', '0'), token.replace('?', 'F')
        else:
            parts = token.split('-')
            first, last = parts[0], parts[-1]
        result.update(code for code in characters if int(first, 16) <= code <= int(last, 16))
    return result


def generate_font(url):
    cache_file = cache / (hashlib.sha256(url.encode()).hexdigest() + '.woff2')
    if not cache_file.exists():
        data = urllib.request.urlopen(url, timeout=30).read()
        cache_file.write_bytes(data)
    original = cache_file.read_bytes()
    font = TTFont(io.BytesIO(original), recalcTimestamp=False)
    available = set(font.getBestCmap())
    kept = characters & available
    options = subset.Options()
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    options.retain_gids = True
    options.notdef_outline = True
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=kept)
    worker.subset(font)
    font.flavor = 'woff2'
    buffer = io.BytesIO()
    font.save(buffer, reorderTables=False)
    data = buffer.getvalue()
    digest = hashlib.sha256(data).hexdigest()
    filename = 'noto-public-glyphs-' + digest[:16] + '.woff2'
    (output / filename).write_bytes(data)
    return {'file':filename, 'sha256':digest, 'sourceSha256':hashlib.sha256(original).hexdigest(), 'bytes':len(data), 'sourceBytes':len(original), 'glyphs':sorted(kept)}

blocks = []
for body in re.findall(r'@font-face\{(.*?)\}', source_css):
    declarations = dict(re.findall(r'([a-z-]+):([^;]+)', body))
    selected = unicode_points(declarations.get('unicode-range', 'U+0-10FFFF'))
    if not selected:
        continue
    url = re.search(r'url\(([^)]+)\)', declarations['src'])[1].strip('\'"')
    if urlparse(url).hostname != 'fonts.gstatic.com':
        raise ValueError('Only existing Google font sources are allowed')
    blocks.append((body, selected, url))
urls = list(dict.fromkeys(url for _, _, url in blocks))
with ThreadPoolExecutor(max_workers=6) as pool:
    fonts = dict(zip(urls, pool.map(generate_font, urls)))
faces = []
for body, selected, url in blocks:
    selected &= set(fonts[url]['glyphs'])
    if not selected:
        continue
    ranges = ','.join('U+' + format(code, 'X') for code in sorted(selected))
    replaced = re.sub(r'src:[^;]+', 'src:url("/fonts/' + fonts[url]['file'] + '") format("woff2")', body)
    replaced = re.sub(r'unicode-range:[^;]+', 'unicode-range:' + ranges, replaced)
    faces.append('@font-face{' + replaced + '}')

# One stylesheet makes the cascade atomic: the original faces must not start
# downloading while a separate, higher-priority subset stylesheet is in flight.
css = source_css + '\n/* Lossless subsets; original static weights and fallback faces are retained. */\n' + '\n'.join(faces) + '\n'
digest = hashlib.sha256(css.encode()).hexdigest()
filename = 'noto-public-glyphs-' + digest[:16] + '.css'
(output / filename).write_text(css)
manifest = {'version':1, 'css':filename, 'cssSha256':digest, 'corpusSha256':hashlib.sha256(corpus.encode()).hexdigest(), 'sourceCssSha256':hashlib.sha256(source_css.encode()).hexdigest(), 'faces':len(faces), 'fonts':list(fonts.values())}
(output / 'noto-public-glyphs-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'css':filename, 'faces':len(faces), 'fonts':len(fonts), 'sourceBytes':sum(f['sourceBytes'] for f in fonts.values()), 'subsetBytes':sum(f['bytes'] for f in fonts.values())}))
