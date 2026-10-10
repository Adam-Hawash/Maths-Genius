# -*- coding: utf-8 -*-
# ترجمة الرسائل الصينية المتبقية من القالب الأصلي إلى العربية في المنصات الأربعة
import io, os, sys

REPLACEMENTS = [
    # (صيني, عربي) — الأطول الأول عشان ما يحصلش تقص
    ('获取公告详情失败:', 'فشل جلب الإعلان:'),
    ('获取公告列表失败:', 'فشل جلب الإعلانات:'),
    ('获取单个公告', 'جلب إعلان بالمعرف'),
    ('公告不存在', 'الإعلان غير موجود'),
    ('公告更新成功', 'تم تحديث الإعلان بنجاح'),
    ('公告删除成功', 'تم حذف الإعلان بنجاح'),
    ('公告创建成功', 'تم إنشاء الإعلان بنجاح'),
    ('创建公告失败:', 'فشل إنشاء الإعلان:'),
    ('更新公告', 'تحديث الإعلان'),
    ('删除公告', 'حذف الإعلان'),
    ('获取所有公告', 'جلب كل الإعلانات'),
    ('标题、内容和年级不能为空', 'العنوان والمحتوى والصف مطلوبين'),
    ('获取讨论详情失败:', 'فشل جلب المناقشة:'),
    ('获取单个讨论', 'جلب مناقشة بالمعرف'),
    ('讨论不存在', 'المناقشة غير موجودة'),
    ('讨论更新成功', 'تم تحديث المناقشة بنجاح'),
    ('讨论删除成功', 'تم حذف المناقشة بنجاح'),
    ('更新讨论', 'تحديث المناقشة'),
    ('删除讨论', 'حذف المناقشة'),
    ('获取作业详情失败:', 'فشل جلب الواجب:'),
    ('获取单个作业', 'جلب واجب بالمعرف'),
    ('作业不存在', 'الواجب غير موجود'),
    ('作业更新成功', 'تم تحديث الواجب بنجاح'),
    ('作业删除成功', 'تم حذف الواجب بنجاح'),
    ('更新作业', 'تحديث الواجب'),
    ('删除作业', 'حذف الواجب'),
    ('获取考试详情失败:', 'فشل جلب الامتحان:'),
    ('获取单个考试', 'جلب امتحان بالمعرف'),
    ('考试不存在', 'الامتحان غير موجود'),
    ('考试更新成功', 'تم تحديث الامتحان بنجاح'),
    ('考试删除成功', 'تم حذف الامتحان بنجاح'),
    ('更新考试', 'تحديث الامتحان'),
    ('删除考试', 'حذف الامتحان'),
    ('服务器内部错误', 'حدث خطأ في السيرفر'),
]

REPOS = ['maths-genius', 'shaimaa-selim-science', 'mensat-alqaid', 'mr-sherif-elsayed']

def has_chinese(s):
    return any('\u4e00' <= ch <= '\u9fff' for ch in s)

total_files = 0
total_repl = 0
for repo in REPOS:
    root = os.path.join('/home/z', repo, 'src')
    for dirpath, _, files in os.walk(root):
        for fn in files:
            if not fn.endswith(('.ts', '.tsx')):
                continue
            path = os.path.join(dirpath, fn)
            with io.open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if not has_chinese(content):
                continue
            orig = content
            for zh, ar in REPLACEMENTS:
                if zh in content:
                    total_repl += content.count(zh)
                    content = content.replace(zh, ar)
            if content != orig:
                with io.open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                total_files += 1
                print(repo, '→', os.path.relpath(path, '/home/z/' + repo))

print('\nfiles changed:', total_files, '| replacements:', total_repl)

# تحقق نهائي: مفيش صيني فاضل
leftover = 0
for repo in REPOS:
    root = os.path.join('/home/z', repo, 'src')
    for dirpath, _, files in os.walk(root):
        for fn in files:
            if not fn.endswith(('.ts', '.tsx')):
                continue
            path = os.path.join(dirpath, fn)
            with io.open(path, 'r', encoding='utf-8') as f:
                if has_chinese(f.read()):
                    leftover += 1
                    print('LEFTOVER CHINESE:', path)
print('leftover files with Chinese:', leftover)
