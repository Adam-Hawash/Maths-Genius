#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""سيناريوهات قفل الجهاز — محاكاة كاملة لسلوك المتصفح ضد /api/students"""
import json, urllib.request, urllib.parse, sys, time

BASE = 'http://localhost:3100'

def req(path, method='GET', body=None):
    url = BASE + path
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode()
        headers['Content-Type'] = 'application/json'
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}

def traits(ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
           platform='Win32', sw='1920', sh='1080', canvas='c1a2b3c4d5', webgl='abc123def', touch='0', tz='Africa/Cairo'):
    return {'ua': ua, 'lang': 'ar-EG', 'langs': 'ar-EG,ar,en', 'platform': platform,
            'sw': sw, 'sh': sh, 'cd': '24', 'aw': '1858', 'ah': '1052', 'orient': '',
            'dpr': '1', 'cores': '8', 'mem': '8', 'touch': touch, 'canvas': canvas, 'webgl': webgl, 'tz': tz}

def login(phone, pwd, uuid, fps, tr, dtype='computer'):
    q = ('/api/students?phone=' + urllib.parse.quote(phone) + '&password=' + urllib.parse.quote(pwd) +
         '&deviceId=' + urllib.parse.quote(uuid) +
         '&deviceIds=' + urllib.parse.quote(json.dumps([uuid] + fps)) +
         '&deviceTraits=' + urllib.parse.quote(json.dumps(tr)) +
         '&deviceType=' + dtype)
    return req(q)

def dv3fp(seed):
    return 'dv3_' + str(abs(hash(seed)) % 10**12)

results = []
def check(name, cond, extra=''):
    results.append((name, cond, extra))
    print(('PASS' if cond else 'FAIL'), name, ('— ' + extra if extra else ''))

PHONE = '0100' + str(int(time.time()))[-8:]
PWD = 'test1234'

# أجهزة الاختبار
A_uuid, A_fp = 'dev_aaa111222333', [dv3fp('deviceA')]
A_tr = traits()
B_uuid, B_fp = 'dev_bbb444555666', [dv3fp('deviceB')]
B_tr = traits(ua='Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
              platform='Linux armv8l', sw='360', sh='800', canvas='cfff9988', webgl='mali777', touch='5', tz='Africa/Cairo')
C_uuid, C_fp = 'dev_ccc777888999', [dv3fp('deviceC')]
C_tr = traits(ua='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
              platform='MacIntel', sw='1728', sh='1117', canvas='cbbb4433', webgl='apple555', touch='0', tz='Africa/Cairo')

# 1) تسجيل حساب من الجهاز A
st, res = req('/api/students', 'POST', {'name': 'طالب اختبار الأجهزة', 'phone': PHONE, 'grade': 'الصف الأول الثانوي',
    'parentName': 'ولي الأمر', 'parentPhone': '01100000000', 'password': PWD,
    'deviceId': A_uuid, 'deviceIds': [A_uuid] + A_fp, 'deviceTraits': json.dumps(A_tr), 'deviceType': 'computer'})
check('1) تسجيل حساب من الجهاز A', st == 201, f'status={st}')
if st != 201:
    print(json.dumps(res, ensure_ascii=False)[:500]); sys.exit(1)

# 2) قبول من الأدمن مباشرة في الداتابيز (تخطي انتظار الموافقة)
import sqlite3
db = sqlite3.connect('/home/z/mr-sherif/db/custom.db')
db.execute("UPDATE Student SET status='approved' WHERE phone=?", (PHONE,))
db.commit(); db.close()

# 3) دخول من نفس الجهاز A (نفس الهوية والبصمة) — لازم ينجح
st, res = login(PHONE, PWD, A_uuid, A_fp, A_tr)
check('2) دخول من نفس جهاز الإنشاء (نفس الهوية+البصمة)', st == 200, f'status={st}')

# 4) دخول بعد مسح بيانات المتصفح (هوية جديدة + نفس البصمة) — إنقاذ بالبصمة
st, res = login(PHONE, PWD, 'dev_newuuid_afterwipe', [dv3fp('deviceA')], A_tr)
check('3) دخول بعد مسح بيانات المتصفح (هوية جديدة+نفس البصمة)', st == 200, f'status={st}')

# 5) دخول بهوية جديدة وبصمة جديدة لكن نفس مكوّنات الجهاز (تحديث متصفح) — إنقاذ بالمكوّنات
st, res = login(PHONE, PWD, 'dev_uuid_afterupdate', [dv3fp('deviceA-updated')], A_tr)
check('4) دخول بعد تحديث المتصفح (بصمة جديدة+نفس المكوّنات)', st == 200, f'status={st}')

# 6) دخول من جهاز غريب تمامًا — لازم 403
st, res = login(PHONE, PWD, C_uuid, C_fp, C_tr)
check('5) جهاز غريب مرفوض 403', st == 403 and res.get('deviceBlocked') == True, f'status={st}')

# 7) **الحالة الجديدة**: متصفح بلا تخزين (مفيش هوية خالص) + نفس مكوّنات الجهاز — لازم ينجح دلوقتي
st, res = login(PHONE, PWD, '', [dv3fp('deviceA-nostorage')], A_tr)
check('6) متصفح بلا هوية (تخزين مقفول) + نفس المكوّنات → ينجح', st == 200, f'status={st}')

# 8) مشاركة حقيقية: جهاز B عليه حساب تاني، ويحاول يفتح حساب A
PHONE2 = '0111' + str(int(time.time()))[-8:]
st, res = req('/api/students', 'POST', {'name': 'صاحب الجهاز B', 'phone': PHONE2, 'grade': 'الصف الأول الثانوي',
    'parentName': 'ولي', 'parentPhone': '01111111111', 'password': PWD,
    'deviceId': B_uuid, 'deviceIds': [B_uuid] + B_fp, 'deviceTraits': json.dumps(B_tr), 'deviceType': 'mobile'})
check('7) تسجيل حساب تاني على الجهاز B', st == 201, f'status={st}')

# 9) حساب A يجرب يدخل من الجهاز B (المربوط بحساب تاني) — لازم 403 (مشاركة)
st, res = login(PHONE, PWD, B_uuid, B_fp, A_tr)
check('8) حساب A من جهاز B المربوط بحساب تاني → 403 مشاركة', st == 403, f'status={st}')

# 10) الأدمن عمل "سماح" → دخول من الجهاز الغريب C — لازم ينجح وينقل الربط لـ C
import sqlite3 as s3
db = s3.connect('/home/z/mr-sherif/db/custom.db')
db.execute("UPDATE Student SET allowAllDevices=1 WHERE phone=?", (PHONE,))
db.commit(); db.close()
st, res = login(PHONE, PWD, C_uuid, C_fp, C_tr)
check('9) بعد "سماح" — دخول من جهاز C → ينجح وينقل الربط', st == 200, f'status={st}')
db = s3.connect('/home/z/mr-sherif/db/custom.db')
row = db.execute("SELECT creationDeviceId, allowAllDevices FROM Student WHERE phone=?", (PHONE,)).fetchone()
db.close()
check('10) الربط اتنقل لجهاز C والسماح اتقفل', row[0] == C_uuid and row[1] == 0, f'creation={row[0]}, allowAll={row[1]}')

# 11) **زرار "اربط جهازي الحالي"**: ربط الحساب بجهاز A يدويًا بكل بياناته
db = s3.connect('/home/z/mr-sherif/db/custom.db')
sid = db.execute("SELECT id FROM Student WHERE phone=?", (PHONE,)).fetchone()[0]
db.close()
st, res = req(f'/api/students/{sid}', 'PUT', {'bindDevice': A_uuid, 'bindDeviceFp': A_fp[0], 'bindDeviceTraits': json.dumps(A_tr), 'bindDeviceType': 'computer'})
check('11) زرار "اربط جهازي الحالي" — الربط نجح', st == 200, f'status={st}')
# دخول من A → ينجح
st, res = login(PHONE, PWD, A_uuid, A_fp, A_tr)
check('12) دخول من الجهاز المربوط يدويًا A → ينجح', st == 200, f'status={st}')
# دخول من C (القديم) → 403
st, res = login(PHONE, PWD, C_uuid, C_fp, C_tr)
check('13) الجهاز القديم C بقى مرفوض 403 بعد النقل', st == 403, f'status={st}')

# 12) تشخيص الحجب مسجل في الأنشطة
db = s3.connect('/home/z/mr-sherif/db/custom.db')
act = db.execute("SELECT details FROM StudentActivity WHERE studentId=? AND action='device_blocked' ORDER BY createdAt DESC LIMIT 1", (sid,)).fetchone()
db.close()
check('14) تشخيص الحجب مسجل فيه الهوية المخزنة والواردة', bool(act) and 'المخزنة' in act[0] and 'الواردة' in act[0], (act[0][:120] if act else 'لا يوجد'))

print('\n========== SUMMARY ==========')
passed = sum(1 for _, ok, _ in results if ok)
print(f'{passed}/{len(results)} passed')
sys.exit(0 if passed == len(results) else 1)
