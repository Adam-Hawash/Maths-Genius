#!/usr/bin/env python3
# Z-19: توحيد المشغل والحمايات على كل المنصات
# Base = Mr-Mohamed-Sabry (النسخة المعتمدة + تعديلات 2026-ص4)
import os, shutil, sys

ROOT = '/home/z/my-project'
BASE = os.path.join(ROOT, 'Mr-Mohamed-Sabry')

PLAYER_SRC = os.path.join(BASE, 'src/components/student/ProtectedYouTubePlayer.tsx')
ROUTE_SRC = os.path.join(BASE, 'src/app/api/player/[ticket]/route.ts')
GUARD_SRC = os.path.join(BASE, 'src/components/RecordingGuard.tsx')
WM_SRC = os.path.join(BASE, 'src/components/student/VideoWatermark.tsx')
PFP_SRC = os.path.join(BASE, 'src/components/student/ProtectedFilePlayer.tsx')

YTIMG_BLOCK = """            <img
              src={'https://i.ytimg.com/vi/' + ytId + '/maxresdefault.jpg'}
              alt="فيديو الدرس"
              className="w-full h-full object-cover bg-black"
              draggable={false}
              onError={function (e) {
                var el = e.currentTarget
                if (el.src.indexOf('maxresdefault') >= 0) {
                  el.src = 'https://i.ytimg.com/vi/' + ytId + '/hqdefault.jpg'
                } else {
                  el.style.visibility = 'hidden'
                }
              }}
            />"""

SABRY_POSTER_LINE = '            <img src="/images/hero-bg.png" alt="Mr. Mohamed Sabry" className="w-full h-full object-contain bg-black" draggable={false} />'
SABRY_CLIP = "navigator.clipboard.writeText('🔒 المحتوى محمي — Mr. Mohamed Sabry')"

# per-platform: (dir, clipboard brand, poster line)
PLATFORMS = {
    'src':                    ('Math Genius',      '            <img src="/images/mr-wael-cover-v2.png" alt="Mr.Wael Khodair" className="w-full h-full object-contain bg-black" draggable={false} />'),
    'Zicola-Math':            ('Zicola In Math',   '            <img src="/images/mr-wael-cover-v2.png" alt="Zicola In Math" className="w-full h-full object-contain bg-black" draggable={false} />'),
    'shaimaa-selim-science':  ('Dr. Shaimaa Science', '            <img src="/images/science-cover.png" alt="منصة شيماء سليم للعلوم" className="w-full h-full object-contain bg-black" draggable={false} />'),
    'Mr-Sherif-ElSayed':      ('Mr Sherif ElSayed', 'YTIMG'),
    'mensat-alqaid':          ('منصة القائد',      'YTIMG'),
}

def read(p): 
    with open(p, 'r', encoding='utf-8') as f: return f.read()

def write(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

def main():
    player = read(PLAYER_SRC)
    route = read(ROUTE_SRC)
    ok, errs = [], []
    for d, (brand, poster) in PLATFORMS.items():
        try:
            dst_player = os.path.join(ROOT, d, 'src/components/student/ProtectedYouTubePlayer.tsx')
            dst_route = os.path.join(ROOT, d, 'src/app/api/player/[ticket]/route.ts')
            # 1) player
            c = player
            assert SABRY_CLIP in c, 'clip anchor missing'
            c = c.replace(SABRY_CLIP, "navigator.clipboard.writeText('🔒 المحتوى محمي — " + brand + "')")
            assert SABRY_POSTER_LINE in c, 'poster anchor missing'
            c = c.replace(SABRY_POSTER_LINE, YTIMG_BLOCK if poster == 'YTIMG' else poster)
            write(dst_player, c)
            # 2) route (Zicola handled separately outside this script)
            if d != 'Zicola-Math':
                r = route.replace('Mr. Mohamed Sabry', brand)
                write(dst_route, r)
            # 3) protections
            if d in ('src', 'mensat-alqaid'):
                write(os.path.join(ROOT, d, 'src/components/RecordingGuard.tsx'), read(GUARD_SRC))
            if d == 'mensat-alqaid':
                write(os.path.join(ROOT, d, 'src/components/student/VideoWatermark.tsx'), read(WM_SRC))
                write(os.path.join(ROOT, d, 'src/components/student/ProtectedFilePlayer.tsx'), read(PFP_SRC))
            ok.append(d)
        except Exception as e:
            errs.append(d + ': ' + str(e))
    print('OK:', ', '.join(ok))
    if errs: print('ERRORS:', ' | '.join(errs)); sys.exit(1)

if __name__ == '__main__':
    main()
