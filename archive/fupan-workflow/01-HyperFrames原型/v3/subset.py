from fontTools.ttLib import TTCollection
from fontTools import subset
import string
chars=set(open('.chars.txt',encoding='utf8').read())|set(string.printable)|set("，。？！：「」·…—✓✕→↓▶¥%+-")
text=''.join(sorted(chars))
for w,f in [(500,'Medium'),(700,'Bold'),(900,'Black')]:
    font=TTCollection(f'/usr/share/fonts/opentype/noto/NotoSansCJK-{f}.ttc').fonts[2]
    o=subset.Options(); o.flavor='woff2'; o.layout_features=['*']
    s=subset.Subsetter(o); s.populate(text=text); s.subset(font)
    font.flavor='woff2'; font.save(f'assets/fonts/hs-{w}.woff2')
print(len(text))
