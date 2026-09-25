# 按实际用到的字给思源黑体做子集(3 个字重各 ~110KB), 输出到 remotion/public/fupan/fonts
# 依赖: pip install fonttools brotli ; 需要系统有 NotoSansCJK-*.ttc (或设置 CJK_TTC_DIR)
import os
HERE=os.path.dirname(os.path.abspath(__file__))
OUT=os.environ.get('FUPAN_FONTS') or os.path.join(HERE,'../../remotion/public/fupan/fonts'); os.makedirs(OUT,exist_ok=True)
TTC=os.environ.get('CJK_TTC_DIR','/usr/share/fonts/opentype/noto')
from fontTools.ttLib import TTCollection
from fontTools import subset
import string
chars=set(open(os.path.join(os.environ.get('FUPAN_WORK') or os.path.join(HERE,'work'),'chars.txt'),encoding='utf8').read())|set(string.printable)|set("，。？！：「」·…—✓✕→↓▶¥%+-")
text=''.join(sorted(chars))
for w,f in [(500,'Medium'),(700,'Bold'),(900,'Black')]:
    font=TTCollection(os.path.join(TTC,f'NotoSansCJK-{f}.ttc')).fonts[2]
    o=subset.Options(); o.flavor='woff2'; o.layout_features=['*']
    s=subset.Subsetter(o); s.populate(text=text); s.subset(font)
    font.flavor='woff2'; font.save(os.path.join(OUT,f'hs-{w}.woff2'))
print(len(text))
