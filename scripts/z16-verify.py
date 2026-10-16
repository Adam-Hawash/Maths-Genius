#!/usr/bin/env python3
# ز16 — تحقق إنتاج فعلي:
# (أ) PUT /api/site-config z16_probe (نفس عملية اللوحة بالظبط)
# (ب) اختبار الجارد على /api/config PUT: نكتب grades_data=GUARDTEST
#     ونطمن إن الداتا الحقيقية ما اتلمست (مع باك أب احتياطي)
# (ج) سلامة داتا شريف (رابعة/خمسة ابتدائي)
import json, urllib.request, urllib.error

PLATFORMS = {
    'Sherif':  'https://maths-station.com',
    'Wael':    'https://maths-genius-pz.vercel.app',
    'Sabry':   'https://mr-mohamed-sabry.vercel.app',
    'Zicola':  'https://zicola-in-math.com',
    'Alqaid':  'https://project-emt-medical.vercel.app',
}

def req(url, method='GET', body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method,
                               headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(r, timeout=30) as res:
            return res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]
    except Exception as e:
        return -1, str(e)[:200]

print('=== (أ) PUT /api/site-config z16_probe ===')
for name, base in PLATFORMS.items():
    st, _ = req(f'{base}/api/site-config', 'PUT', {'key': 'z16_probe', 'value': 'ok'})
    st2, _ = req(f'{base}/api/site-config', 'PUT', {'key': 'z16_probe', 'value': ''})
    print(f'{name:8s} => first={st} neutralize={st2}')

print()
print('=== (ب) اختبار جارد /api/config على شريف + زيكولا ===')
for name in ['Sherif', 'Zicola']:
    base = PLATFORMS[name]
    st, body = req(f'{base}/api/config?fresh={int(__import__("time").time())}')
    cfg = json.loads(body)
    backup_grades, backup_sched = cfg.get('grades_data'), cfg.get('schedule_data')
    st, _ = req(f'{base}/api/config', 'PUT', {'grades_data': 'Z16GUARDTEST', 'schedule_data': 'Z16GUARDTEST'})
    st, body = req(f'{base}/api/config?fresh={int(__import__("time").time())}')
    cfg2 = json.loads(body)
    g, s = cfg2.get('grades_data'), cfg2.get('schedule_data')
    guard_ok = (g == backup_grades and s == backup_sched)
    print(f'{name:8s} => put={st} guard={"PROTECTED ✅" if guard_ok else "CLOBBERED ❌"}')
    if not guard_ok:
        req(f'{base}/api/site-config', 'PUT', {'key': 'grades_data', 'value': backup_grades or ''})
        req(f'{base}/api/site-config', 'PUT', {'key': 'schedule_data', 'value': backup_sched or ''})
        print(f'{name:8s} => RESTORED from backup')

print()
print('=== (ج) سلامة داتا شريف ===')
st, body = req(f'{PLATFORMS["Sherif"]}/api/config?fresh=1')
cfg = json.loads(body)
try:
    grades = json.loads(cfg.get('grades_data') or '[]')
    names = [g.get('ar') for g in grades]
    print('grades:', names)
except Exception as e:
    print('grades parse err', e)
try:
    sched = json.loads(cfg.get('schedule_data') or '[]')
    print('schedule days:', [d.get('day') for d in sched], '| slots:', sum(len(d.get("slots", [])) for d in sched))
except Exception as e:
    print('schedule parse err', e)
