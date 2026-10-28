#!/usr/bin/env python3
# Z-20 replication: RTL DirectionProvider + quality scaler + play-block shrink
import json, subprocess, sys, os

ROOT = '/home/z/my-project'
KILL_OLD = """  #ytShareHi{position:absolute;z-index:46;bottom:44px;right:0;width:20%;height:clamp(64px,16%,90px);pointer-events:auto;background:transparent}
  #ytBrandHi{position:absolute;z-index:46;bottom:44px;left:54px;width:58%;height:clamp(96px,22%,130px);pointer-events:auto;background:transparent}"""
KILL_NEW = """  #ytShareHi{position:absolute;z-index:46;bottom:44px;right:0;width:16%;height:clamp(48px,14%,72px);pointer-events:auto;background:transparent}
  #ytBrandHi{position:absolute;z-index:46;bottom:44px;left:54px;width:24%;height:clamp(56px,16%,84px);pointer-events:auto;background:transparent}"""

CSS_ANCHOR = "  #yt,#fileVid{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}"
CSS_NEW = CSS_ANCHOR + """
  /* (ز20) موائم الجودة HD — الأصل الجذري لـ«المنصة 360 واليوتيوب 1080»:
     يوتيوب بيحدد المستويات اللي بتظهر في ⚙ **بمقاس المشغل الفعلي** —
     وحاوياتنا (مودال البورتال 390×219 على الموبايل / 1024×576 على
     الديسكتوب) أصغر من حد الـHD فقايمة ⚙ بتقفل على 360p والفيديو
     بيتفتح 360. الحل: **المشغل بيرندر داخليًا بمقاس HD (أقل حاجة
     1280×720)** وبيتكوّم بصريًا بـ CSS transform:scale على الـ iframe
     نفسه — **المحتوى جوه الـ iframe مش بيشوف الـ transform خالص**
     (الـ viewport الداخلي بيفضل 1280×720) فقايمة ⚙ بتطلع بالجودات
     الحقيقية كلها زي يوتيوب بالظبط (حتى 1080p) والفيديو كامل 100%
     بلا أي قص (transform-origin center + النسبة محفوظة).
     الديسكتوب الكبير (ملء شاشة ≥1280×720): scale=1 = مقاس طبيعي بالظبط */
  #ytQWrap,#ytPlain{position:absolute;top:50%;left:50%;border:0;background:#000;
    transform:translate(-50%,-50%) scale(var(--mgYtS,1));transform-origin:center center}
  #ytQWrap > #ytHost{position:absolute;inset:0;width:100%;height:100%}
  #ytPlain{width:100%;height:100%;display:block}"""

CSS_SCALER_OLD = """  /* (2026-د) مشغل يوتيوب العملاق: بيرندر 1920×1080 وبيتصغّر بـ CSS scale —
     يوتيوب بيحدد سقف التيار بمقاس المشغل (مشغل 390px على الموبايل = سقف 480p
     — ده كان السبب الحقيقي إن الفيديو بيتفتح 360/480 حتى مع أرضية الجودة)
     والمقاس الكبير بيسمح بتيار 720p/1080p فعلًا + التصغير بيحافظ على الحدة */
  #mgYtScaler{position:absolute;top:50%;left:50%;width:1920px;height:1080px;
    transform:translate(-50%,-50%) scale(var(--mgYtS,.2));transform-origin:center center;background:#000}
  #mgYtScaler iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}"""

FIT_OLD = """/* (2026-د) ملاءمة المشغل العملاق 1920×1080 جوه الصندوق (تصغير contain) —
   بتتنادى مع كل layoutWrap (ريسايز/ملء شاشة/دوران) */
function mgYtFit(){
  try{
    var scs = document.querySelectorAll('#mgYtScaler');
    for(var i=0;i<scs.length;i++){
      var sc = scs[i];
      var w = (wrap && wrap.clientWidth) || window.innerWidth || 0;
      var h = (wrap && wrap.clientHeight) || window.innerHeight || 0;
      if(w<=0 || h<=0) continue;
      var s = Math.min(w/1920, h/1080);
      sc.style.setProperty('--mgYtS', String(s));
    }
  }catch(e){}
}"""

FIT_NEW = """/* (ز20) موائم الجودة HD — بيرندر المشغل داخليًا بمقاس HD (أقل حاجة
   1280×720) ويكوّمه بـ CSS scale — الـ viewport الداخلي لليوتيوب بيفضل
   HD فقايمة ⚙ بتعرض كل الجودات الحقيقية زي يوتيوب (سقف المقاس الصغير
   360p اتشال من جذوره). بتتنادى مع كل layoutWrap (ريسايز/ملء شاشة/دوران) */
function mgYtFit(){
  try{
    if(CFG.kind !== 'youtube') return;
    var w = (wrap && wrap.clientWidth) || window.innerWidth || 0;
    var h = (wrap && wrap.clientHeight) || window.innerHeight || 0;
    if(w<=0 || h<=0) return;
    var iw = Math.max(w,1280), ih = Math.max(h,720);
    var s = Math.min(w/iw, h/ih);
    var ids = ['ytQWrap','ytPlain'];
    for(var i=0;i<ids.length;i++){
      var el = document.getElementById(ids[i]);
      if(!el) continue;
      el.style.width = iw + 'px';
      el.style.height = ih + 'px';
      el.style.setProperty('--mgYtS', String(s));
    }
  }catch(e){}
}"""

MOUNT_OLD = """  var host = document.createElement('div');
  host.id = 'ytHost';
  host.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000';
  wrap.appendChild(host);
  ensureYtCovers();"""
MOUNT_NEW = """  /* (ز20) غلاف سكالر الجودة: new YT.Player بيستبدل الديف اللي بيبني عليه
     بالـ iframe بتاعه (بيمسك الـ id والستايل بيفضل) — فالحل غلاف خارجي
     **بيفضل موجود** هو اللي بيتكوّم بالـ scale، والمشغل جواه 100%×100% */
  var qWrap = document.createElement('div');
  qWrap.id = 'ytQWrap';
  qWrap.style.cssText = 'position:absolute;top:50%;left:50%;background:#000;transform:translate(-50%,-50%) scale(var(--mgYtS,1));transform-origin:center center';
  var host = document.createElement('div');
  host.id = 'ytHost';
  host.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000';
  qWrap.appendChild(host);
  wrap.appendChild(qWrap);
  /* (ز20) المقاس فورًا قبل بناء المشغل عشان الـ viewport الداخلي يولد HD */
  layoutWrap();
  ensureYtCovers();"""

PLAIN_OLD = """  var f = document.getElementById('ytPlain');
  if(!f){
    /* (ز21) مقاس طبيعي 100% — الكنترولز الأصلية لازم تبان بمقاسها الحقيقي */
    f = document.createElement('iframe');
    f.id = 'ytPlain';
    f.setAttribute('allow','autoplay; fullscreen; encrypted-media; picture-in-picture');
    f.setAttribute('allowfullscreen','');
    f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#000';
    wrap.appendChild(f);
  }"""
PLAIN_NEW = """  var f = document.getElementById('ytPlain');
  if(!f){
    /* (ز21) مقاس طبيعي 100% — الكنترولز الأصلية لازم تبان بمقاسها الحقيقي
       (ز20) المقاس الفعلي بيكتبه mgYtFit px (أقل حاجة 1280×720) والـ CSS
       بيكوّمه بـ scale — فالوضع البديل كمان بياخد الجودات الحقيقية */
    f = document.createElement('iframe');
    f.id = 'ytPlain';
    f.setAttribute('allow','autoplay; fullscreen; encrypted-media; picture-in-picture');
    f.setAttribute('allowfullscreen','');
    f.style.cssText = 'position:absolute;top:50%;left:50%;border:0;background:#000;transform:translate(-50%,-50%) scale(var(--mgYtS,1));transform-origin:center center';
    wrap.appendChild(f);
  }"""

KILLIDS_OLD = "  var killIds = ['ytHost','ytCrop','startOv','centerOv','endOv','ytCtrl','peBox','unmuteBtn','mgYtScaler'];"
KILLIDS_NEW = "  var killIds = ['ytHost','ytQWrap','ytCrop','startOv','centerOv','endOv','ytCtrl','peBox','unmuteBtn','mgYtScaler'];"

REBUILD_OLD = """  rebuildTries++;
  ytHostKind = (kind === 'nocookie') ? 'nocookie' : 'www';
  try{ if(playerApi && playerApi.destroy) playerApi.destroy(); }catch(e){}
  playerApi = null;
  if(wdTimer){ clearInterval(wdTimer); wdTimer = null; }
  var old = document.getElementById('ytHost');
  if(old && old.parentNode) old.parentNode.removeChild(old);
  var crop = document.getElementById('ytCrop');
  var host = document.createElement('div');
  host.id = 'ytHost';
  host.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000';
  if(crop) crop.appendChild(host); else wrap.appendChild(host);
  pendingStart = true;
  try{ buildPlayer(); }catch(e){ showPlayError(msgForYtError(lastErrCode || 'auth')); }"""
REBUILD_NEW = """  rebuildTries++;
  ytHostKind = (kind === 'nocookie') ? 'nocookie' : 'www';
  try{ if(playerApi && playerApi.destroy) playerApi.destroy(); }catch(e){}
  playerApi = null;
  if(wdTimer){ clearInterval(wdTimer); wdTimer = null; }
  /* (ز20) إعادة البناء بنفس غلاف سكالر الجودة — غير كده الريتراي بيرجع
     بالمشغل الطبيعي الصغير وقايمة ⚙ بتقفل على 360 تاني */
  var oldQ = document.getElementById('ytQWrap');
  if(oldQ && oldQ.parentNode) oldQ.parentNode.removeChild(oldQ);
  var old = document.getElementById('ytHost');
  if(old && old.parentNode) old.parentNode.removeChild(old);
  var crop = document.getElementById('ytCrop');
  var rq = document.createElement('div');
  rq.id = 'ytQWrap';
  rq.style.cssText = 'position:absolute;top:50%;left:50%;background:#000;transform:translate(-50%,-50%) scale(var(--mgYtS,1));transform-origin:center center';
  var host = document.createElement('div');
  host.id = 'ytHost';
  host.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000';
  rq.appendChild(host);
  if(crop) crop.appendChild(rq); else wrap.appendChild(rq);
  layoutWrap();
  pendingStart = true;
  try{ buildPlayer(); }catch(e){ showPlayError(msgForYtError(lastErrCode || 'auth')); }"""

RADIX_STORE = """'use client'

/* ============================================================
   (ز20) مزوّد اتجاه Radix — إصلاح «الترتيب المعكوس» في لوحة التحكم
   ============================================================
   مكوّنات Radix (التابات/القوائم/الدايلوجات) بتطلع dir="ltr" مرشم
   عليها من المكتبة نفسها لما ميبقاش DirectionProvider — فجذر <Tabs>
   بيتقلب LTR جوه صفحة RTL وشكل التابات بيطلع معكوس (أول تاب على
   الشمال بدل اليمين). الحل: DirectionProvider حوالين المنصة كلها
   بياخد اتجاهه من ستور اللغة (نفس مصدر سكريبت الـ head وLangBoot). */
import * as React from 'react'
import { DirectionProvider } from '@radix-ui/react-direction'
import { useLangStore } from '__STORE__'

export function RadixDirection({ children }: { children: React.ReactNode }) {
  var lang = useLangStore(function (s: { lang: 'ar' | 'en' }) { return s.lang })
  return (
    <DirectionProvider dir={lang === 'en' ? 'ltr' : 'rtl'}>
      {children}
    </DirectionProvider>
  )
}
"""

RADIX_RTL = """'use client'

/* ============================================================
   (ز20) مزوّد اتجاه Radix — إصلاح «الترتيب المعكوس» في لوحة التحكم
   ============================================================
   مكوّنات Radix (التابات/القوائم/الدايلوجات) بتطلع dir="ltr" مرشم
   عليها من المكتبة نفسها لما ميبقاش DirectionProvider — فجذر <Tabs>
   بيتقلب LTR جوه صفحة RTL وشكل التابات بيطلع معكوس (أول تاب على
   الشمال بدل اليمين). المنصة دي عربي RTL دايمًا فالمزوّد ثابت rtl. */
import * as React from 'react'
import { DirectionProvider } from '@radix-ui/react-direction'

export function RadixDirection({ children }: { children: React.ReactNode }) {
  return <DirectionProvider dir="rtl">{children}</DirectionProvider>
}
"""

def patch(path, old, new, name, required=True):
    s = open(path).read()
    if old in s:
        if s.count(old) != 1 and name != 'killblocks':
            print(f'    WARN multiple ({s.count(old)}) anchors for {name}')
        s = s.replace(old, new, 1)
        open(path, 'w').write(s)
        print(f'    OK  {name}')
        return True
    print(f'    {"MISS" if required else "skip"} {name}')
    return False

def add_dep(repo):
    p = os.path.join(ROOT, repo, 'package.json')
    d = json.load(open(p))
    if '@radix-ui/react-direction' in d['dependencies']:
        print('    dep exists'); return
    d['dependencies']['@radix-ui/react-direction'] = '^1.1.1'
    d['dependencies'] = dict(sorted(d['dependencies'].items()))
    json.dump(d, open(p, 'w'), indent=2, ensure_ascii=False)
    open(p, 'a').write('\n')
    print('    dep added')

def git(repo, *args):
    return subprocess.run(['git', '-C', os.path.join(ROOT, repo)] + list(args),
                          capture_output=True, text=True)

def run_full(repo, store_import):
    route = os.path.join(ROOT, repo, 'src/app/api/player/[ticket]/route.ts')
    print(f'  [router]')
    patch(route, KILL_OLD, KILL_NEW, 'killblocks')
    patch(route, CSS_SCALER_OLD, '', 'scaler-css-remove', required=False)
    patch(route, CSS_ANCHOR + '\n', CSS_NEW + '\n', 'scaler-css', required=False) if '#ytQWrap' not in open(route).read() else print('    skip scaler-css (has it)')
    patch(route, FIT_OLD, FIT_NEW, 'mgYtFit')
    patch(route, MOUNT_OLD, MOUNT_NEW, 'mountYouTube-qwrap')
    patch(route, PLAIN_OLD, PLAIN_NEW, 'ytPlain')
    patch(route, KILLIDS_OLD, KILLIDS_NEW, 'killIds')
    patch(route, REBUILD_OLD, REBUILD_NEW, 'rebuild-path')
    print(f'  [rtl]')
    add_dep(repo)
    rd = os.path.join(ROOT, repo, 'src/components/RadixDirection.tsx')
    open(rd, 'w').write(RADIX_STORE.replace('__STORE__', store_import))
    print('    RadixDirection written')
    lp = os.path.join(ROOT, repo, 'src/app/layout.tsx')
    s = open(lp).read()
    if 'RadixDirection' not in s:
        s = s.replace('import { ThemeProvider } from "@/components/theme-provider";',
                      'import { ThemeProvider } from "@/components/theme-provider";\nimport { RadixDirection } from "@/components/RadixDirection";', 1)
        s = s.replace('<ThemeProvider>{children}</ThemeProvider>',
                      '<ThemeProvider><RadixDirection>{children}</RadixDirection></ThemeProvider>', 1)
        open(lp, 'w').write(s)
        print('    layout wired')
    else:
        print('    layout already wired')

def run_rtl_only(repo):
    print(f'  [rtl only]')
    add_dep(repo)
    rd = os.path.join(ROOT, repo, 'src/components/RadixDirection.tsx')
    open(rd, 'w').write(RADIX_RTL)
    print('    RadixDirection written')
    lp = os.path.join(ROOT, repo, 'src/app/layout.tsx')
    s = open(lp).read()
    if 'RadixDirection' not in s:
        s = s.replace('import { ThemeProvider } from "@/components/theme-provider";',
                      'import { ThemeProvider } from "@/components/theme-provider";\nimport { RadixDirection } from "@/components/RadixDirection";', 1)
        s = s.replace('<ThemeProvider>{children}</ThemeProvider>',
                      '<ThemeProvider><RadixDirection>{children}</RadixDirection></ThemeProvider>', 1)
        open(lp, 'w').write(s)
        print('    layout wired')

def ship(repo, msg):
    r = git(repo, 'add', '-A')
    c = git(repo, '-c', 'user.name=Adam-Hawash', '-c', 'user.email=Adam-Hawash@users.noreply.github.com',
            'commit', '-m', msg)
    out = (c.stdout + c.stderr).strip().splitlines()
    print('    commit:', out[-1] if out else '?')
    p = git(repo, 'push', 'origin', 'main')
    print('    push:', (p.stdout + p.stderr).strip().splitlines()[-1] if (p.stdout + p.stderr).strip() else '?')

MSG_FULL = ("ز20: التابات RTL تاني (أول تاب أقصى اليمين زي الأول — DirectionProvider بيربط Radix باتجاه الصفحة بدل ltr الافتراضي اللي كان بيلف شريط التابات) + الجودة الحقيقية زي يوتيوب (المشغل بيرندر داخليًا 1280×720 HD وبيتكوّم بـ scale — المحتوى الداخلي مش بيشوف الـ transform فقايمة ⚙ بتطلع بكل المستويات الحقيقية حتى 1080p بدل قفل 360) + زرار التشغيل الكبير رجع يشتغل (بلوكات القتل كانت بتغطي وسط الفيديو على الموبايل — اتصغّرت والوسط بقى حر والزراير الممنوعة لسه ميتة)")
MSG_RTL = "ز20: التابات RTL تاني (أول تاب أقصى اليمين زي الأول — DirectionProvider بيربط Radix باتجاه الصفحة بدل ltr الافتراضي اللي كان بيلف شريط التابات) + بلوكات قتل الزراير اتصغّرت عشان زرار التشغيل الكبير في وسط الفيديو يرجع يشتغل على الموبايل (كان مغطي) — والزراير الممنوعة لسه ميتة"

which = sys.argv[1]
if which == 'full3':
    for repo, store in [('Mr-Mohamed-Sabry', '@/lib/i18n'),
                        ('Mr-Sherif-ElSayed', '@/lib/i18n'),
                        ('shaimaa-selim-science', '@/lib/i18n-store')]:
        print(f'=== {repo} ===')
        run_full(repo, store)
elif which == 'qaid':
    repo = 'mensat-alqaid'
    print(f'=== {repo} ===')
    route = os.path.join(ROOT, repo, 'src/app/api/player/[ticket]/route.ts')
    patch(route, KILL_OLD, KILL_NEW, 'killblocks')
    run_rtl_only(repo)
elif which == 'ship3':
    for repo in ['Mr-Mohamed-Sabry', 'Mr-Sherif-ElSayed', 'shaimaa-selim-science']:
        print(f'=== {repo} ===')
        ship(repo, MSG_FULL)
elif which == 'shipq':
    ship('mensat-alqaid', MSG_RTL)
