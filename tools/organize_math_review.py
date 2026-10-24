from pathlib import Path
import hashlib
import json
import re
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(r'C:\Users\BeileLee\Desktop\复习总结\数学\数学')
SKIP = ('不可用', '损坏', '无法打开', '乱码')

def valid_docx(p: Path):
    try:
        if not zipfile.is_zipfile(p):
            return False, '不是有效 DOCX 压缩包'
        with zipfile.ZipFile(p) as z:
            names = set(z.namelist())
            if 'word/document.xml' not in names:
                return False, '缺少正文'
            root = ET.fromstring(z.read('word/document.xml'))
            text = ''.join(root.itertext()).strip()
            if len(text) < 20:
                return False, '正文为空或过短'
        return True, ''
    except Exception as e:
        return False, str(e)

def valid_doc(p: Path):
    try:
        with p.open('rb') as f:
            head = f.read(8)
        if head != bytes.fromhex('D0CF11E0A1B11AE1'):
            return False, '不是有效 Word DOC 文件'
        if p.stat().st_size < 4096:
            return False, '文件过小，疑似损坏'
        return True, ''
    except Exception as e:
        return False, str(e)

def grade_for(p: Path):
    s = str(p)
    if '高一' in s: return '一年级'
    if '高二' in s: return '二年级'
    if '高三' in s or '高考' in s: return '三年级'
    return None

def score(p: Path):
    s = str(p)
    score = 1000 - len(p.parts)
    for token, penalty in [('备份', 100), ('转换版', 80), ('清晰候选重建', 60), ('高难度试卷', 30), ('整理中', 20)]:
        if token in s: score -= penalty
    return score

files = [p for p in ROOT.rglob('*') if p.is_file() and p.suffix.lower() in {'.doc', '.docx'}]
report = {'total': len(files), 'skip_unusable': [], 'invalid': [], 'unclassified': [], 'valid': []}
valid = []
for p in files:
    if any(x in str(p) for x in SKIP):
        report['skip_unusable'].append({'path': str(p), 'reason': '路径标记为不可用/损坏'})
        continue
    ok, reason = valid_docx(p) if p.suffix.lower() == '.docx' else valid_doc(p)
    if not ok:
        report['invalid'].append({'path': str(p), 'reason': reason})
        continue
    grade = grade_for(p)
    if not grade:
        report['unclassified'].append(str(p))
        continue
    digest = hashlib.sha256(p.read_bytes()).hexdigest()
    valid.append((digest, score(p), p, grade))

best = {}
for digest, sc, p, grade in valid:
    if digest not in best or sc > best[digest][0]:
        best[digest] = (sc, p, grade)
report['valid'] = [{'path': str(p), 'grade': grade, 'sha256': digest} for digest, (sc, p, grade) in best.items()]
print(json.dumps(report, ensure_ascii=False, indent=2))
