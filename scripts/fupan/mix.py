# 复盘故事视频 · 混音: 配音 + 按剧情走的合成配乐(和弦随场景变化/人声闪避/高潮前抽空蓄力) + 卡点音效
# 用法: python3 mix.py <timing.json> <vo.wav> <out.wav>   (之后 run.sh 用 ffmpeg loudnorm 统一到 -15 LUFS)
import sys, json, numpy as np, soundfile as sf
T=json.load(open(sys.argv[1],encoding='utf8')); SR=44100
vo,sr=sf.read(sys.argv[2])
vo=np.interp(np.linspace(0,len(vo)-1,int(len(vo)*SR/sr)),np.arange(len(vo)),vo)
D=T['duration']+0.25; N=int(D*SR); t=np.arange(N)/SR
V=np.zeros(N); V[:min(N,len(vo))]=vo[:N]
M=np.zeros(N); X=np.zeros(N)   # music, sfx
rng=np.random.default_rng(11)
db=lambda v:10**(v/20)
S={s['id']:s for s in T['scenes']}
PUN="，。？！、：；,.?!"
def PH(sc,i): return [p for p in T['phrases'] if p['scene']==sc][i]
def KT(sc,i,w):
    p=PH(sc,i); k=p['text'].find(w); n=len([c for c in p['text'] if c not in PUN]); pre=len([c for c in p['text'][:max(0,k)] if c not in PUN])
    return p['start']+pre/n*(p['end']-p['start'])
def add(buf,at,s):
    i=int(at*SR)
    if i<0: s=s[-i:]; i=0
    j=min(N,i+len(s))
    if i<N: buf[i:j]+=s[:j-i]
def tone(f,dur,decay,v,harm=(1,.3,.12)):
    n=int(dur*SR); tt=np.arange(n)/SR
    return sum(a*np.sin(2*np.pi*f*(k+1)*tt) for k,a in enumerate(harm))*np.exp(-tt*decay)*db(v)*np.minimum(1,tt/0.004)
# ---------- music ----------
bpm=100; beat=60/bpm; e8=beat/2
hz=lambda m:440*2**((m-69)/12)
chords=[ # (start, notes midi)
 (0,[57,60,64,71]),                     # Am(add9-ish)
 (S['modes']['start'],[53,57,60,64]),   # Fmaj7
 (S['fail']['start'],[50,53,57,60]),    # Dm7
 (S['realize']['start'],[53,57,60,67]), # Fadd9
 (S['close']['start'],[55,59,62,67]),   # G
 (KTc:=0,[0]),
]
drop=KT('close',3,'赚钱效应')
chords=[c for c in chords if c[1]!=[0]]+[(drop,[48,55,60,64]),(S['cta']['start'],[48,55,60,64])]  # C
chords.sort()
def chord_at(x):
    cur=chords[0][1]
    for st,nt in chords:
        if x>=st: cur=nt
    return cur
# pad
for ci,(st,nt) in enumerate(chords):
    en=chords[ci+1][0] if ci+1<len(chords) else D
    n=int((en-st+0.6)*SR); tt=np.arange(n)/SR
    pad=sum(np.sin(2*np.pi*hz(m-12 if k==0 else m)*tt+k)*(.8 if k==0 else .45) for k,m in enumerate(nt))
    env=np.minimum(1,tt/0.5)*np.minimum(1,np.maximum(0,(en-st+0.6-tt))/0.6)
    add(M,st,pad*env*db(-31))
# plucked arpeggio + drums
pattern=[0,2,1,3,2,1,3,2]
k=0; x=0.0
while x<D-0.8:
    in_break = drop-1.6 < x < drop
    nt=chord_at(x)
    if not in_break and x>0.1:
        m=nt[pattern[k%8]%len(nt)]+12
        add(M,x,tone(hz(m),0.5,9,-33,(1,.5,.25,.1)))
        if k%4==0: # kick on beats 1,3 (every 2 beats)
            n=int(0.22*SR); tt=np.arange(n)/SR
            add(M,x,np.sin(2*np.pi*(48+70*np.exp(-tt*35))*tt)*np.exp(-tt*16)*db(-24))
        if k%2==1: # hat
            n=int(0.05*SR); h=np.diff(rng.standard_normal(n+1))*np.exp(-np.arange(n)/SR*90); add(M,x,h*db(-40))
    k+=1; x+=e8
# ducking under voice
env=np.abs(V); w=int(0.03*SR); env=np.convolve(env,np.ones(w)/w,'same')
env=env/max(1e-6,env.max()); rel=np.zeros(N); a=0
for i in range(0,N,64):
    a=max(env[i],a*0.985); rel[i:i+64]=a
M*= (1-0.5*np.clip(rel*2.2,0,1))
# ---------- sfx ----------
def whoosh(at,v=-21,dur=0.5):
    n=int(dur*SR); tt=np.arange(n)/SR; nz=rng.standard_normal(n)
    lp=np.convolve(nz,np.ones(8)/8,'same'); e=np.sin(np.pi*tt/dur)**3; add(X,at-dur*0.6,lp*e*db(v))
def pop(at,f=880,v=-17): add(X,at,tone(f,0.14,35,v,(1,.2)))
def click(at,v=-24):
    n=int(0.012*SR); add(X,at,rng.standard_normal(n)*np.exp(-np.arange(n)/SR*400)*db(v))
def thud(at,v=-12):
    n=int(0.35*SR); tt=np.arange(n)/SR; add(X,at,np.sin(2*np.pi*(45+90*np.exp(-tt*30))*tt)*np.exp(-tt*10)*db(v))
    add(X,at,np.convolve(rng.standard_normal(int(0.25*SR)),np.ones(20)/20,'same')*np.exp(-np.arange(int(0.25*SR))/SR*14)*db(v-4))
def riser(end,dur=1.5,v=-20):
    n=int(dur*SR); tt=np.arange(n)/SR; f=200+1400*(tt/dur)**2
    s=np.sin(2*np.pi*np.cumsum(f)/SR)*0.4+np.convolve(rng.standard_normal(n),np.ones(4)/4,'same')*0.6
    add(X,end-dur,s*(tt/dur)**2*db(v))
def chime(at,v=-16):
    for i,m in enumerate([76,79,84]): add(X,at+i*0.07,tone(hz(m),0.6,6,v,(1,.3)))
for s in T['scenes'][1:]: whoosh(s['start'])
# hook
for i in range(12): click(0.1+i*0.12,-26)
thud(KT('hook',3,'看错了')-0.2+0.28,-11)
# struggle
for i in range(3): pop(PH('struggle',3)['start']+0.25+i*0.28,700+i*120)
pop(PH('struggle',3)['start']+0.1,330,-15)
# dialog typing + bubbles
for i in range(8): click(S['dialog']['start']+0.1+i*0.09,-28)
pop(PH('dialog',1)['start'],1046,-15)
for i in range(5): click(PH('dialog',2)['start']+i*0.09,-28)
pop(PH('dialog',3)['start'],880,-15)
# money: coins
for i in range(16):
    t0=PH('money',3)['start']+(i%8)*0.14+(i//8)*0.5+0.7
    add(X,t0,tone(hz(96+(i%3)*2),0.18,25,-27,(1,.6,.3)))
pop(KT('money',2,'今天的钱'),523,-14)
# modes
pop(S['modes']['start']+0.1,784,-15)
for i in range(1,4): pop(PH('modes',i)['start'],784+i*110,-15)
# premium: rising
for i in range(5): add(X,S['premium']['start']+0.2+i*0.16,tone(hz(64+i*2),0.2,18,-22))
chime(PH('premium',2)['start']+0.1,-18)
# fail: falling
for i in range(6): add(X,PH('fail',1)['start']+i*0.09,tone(hz(72-i*2),0.2,18,-22))
thud(PH('fail',3)['start']+0.45,-12)
# realize
add(X,PH('realize',0)['start']+0.5,tone(hz(88),0.8,5,-17,(1,.4,.2)))  # bulb ding
pop(PH('realize',1)['start']+1.4,330,-15); chime(KT('realize',4,'资金认可')+0.1,-18)
# climax
riser(drop,1.5,-19); thud(drop,-8); chime(drop+0.05,-15)
for i in range(3): pop(PH('close',4)['start']+0.5+i*0.15,880+i*110,-18)
# cta
for i in range(4): pop(KT('cta',1,'哪一类')+i*0.1,660+i*110,-18)
for i in range(6): click(PH('cta',2)['start']+0.3+i*0.1,-24)
click(PH('cta',3)['start']+0.75,-14); chime(PH('cta',3)['start']+0.95,-16)
# v3 extras
st0=S['struggle']['start']; st2=PH('struggle',2)['start']
x=st0
while x<st2-0.2: click(x,-31); x+=0.12 if int(x*10)%7 else 0.2
chime(st2+0.2,-19)
for i in range(3): whoosh(PH('premium',2)['start']+0.6+i*0.9,-27,0.35)
for i in range(5): pop(KT('fail',1,'集体低开')+i*0.05,300-i*20,-20)
# ---------- master ----------
out=V*1.0+M+X
out=np.tanh(out*1.1)/np.tanh(1.1)
fade=np.minimum(1,(D-t)/0.4); out*=fade
out=out/np.abs(out).max()*0.92
sf.write(sys.argv[3],np.stack([out,out],1).astype(np.float32),SR,subtype='PCM_16')
print('ok',round(D,2))
