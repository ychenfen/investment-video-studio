import json, numpy as np, soundfile as sf
T=json.load(open('timing.json')); SR=44100
vo,sr=sf.read('../fp/vo.wav');
# resample vo 24k->44.1k
x=np.linspace(0,len(vo)-1,int(len(vo)*SR/sr)); vo=np.interp(x,np.arange(len(vo)),vo)
D=T['duration']+0.2; N=int(D*SR); out=np.zeros(N); out[:len(vo)]+=vo[:N]
t=np.arange(N)/SR
rng=np.random.default_rng(7)
def db(v): return 10**(v/20)
# pad: Am add9 voicing, slow swell, lowpassed by using sines only
notes=[110.0,164.81,220.0,261.63,329.63,493.88]
pad=sum(np.sin(2*np.pi*f*t+ i)*(0.9 if f<200 else 0.5) for i,f in enumerate(notes))
pad*= (0.6+0.4*np.sin(2*np.pi*0.07*t))
env=np.minimum(1,t/2.5)*np.minimum(1,(D-t)/2.0)
pad=pad/np.abs(pad).max()*db(-30)*env
# chord change to Fmaj7 in the realize/close part
sw=T['scenes'][7]['start']
notes2=[87.31,130.81,174.61,220.0,261.63,329.63]
pad2=sum(np.sin(2*np.pi*f*t+i)*(0.9 if f<200 else 0.5) for i,f in enumerate(notes2)); pad2=pad2/np.abs(pad2).max()*db(-30)*env*(0.6+0.4*np.sin(2*np.pi*0.07*t))
xf=np.clip((t-sw)/1.5,0,1); out+=pad*(1-xf)+pad2*xf
# soft pulse (sub thump) every beat at 96bpm, quiet, ducks under voice later via overall
beat=60/96
def thump(at,v=-22):
    n=int(0.25*SR); tt=np.arange(n)/SR; s=np.sin(2*np.pi*(55+60*np.exp(-tt*30))*tt)*np.exp(-tt*14)*db(v); add(at,s)
def add(at,s):
    i=int(at*SR); j=min(N,i+len(s));
    if i<N: out[i:j]+=s[:j-i]
def pop(at,v=-16,f=880):
    n=int(0.12*SR); tt=np.arange(n)/SR; s=np.sin(2*np.pi*f*tt*(1+tt*4))*np.exp(-tt*40)*db(v); add(at,s)
def whoosh(at,v=-22,dur=0.45):
    n=int(dur*SR); tt=np.arange(n)/SR; nz=rng.standard_normal(n)
    # simple bandpass sweep via moving average of different lengths
    k=np.convolve(nz,np.ones(6)/6,'same'); e=np.sin(np.pi*tt/dur)**2; add(at-dur*0.5,k*e*db(v))
def impact(at,v=-12):
    thump(at,v); n=int(0.6*SR); tt=np.arange(n)/SR; nz=np.convolve(rng.standard_normal(n),np.ones(30)/30,'same'); add(at,nz*np.exp(-tt*6)*db(v-2))
for k in range(int(D/beat)):
    if 0.5<k*beat<D-1.5: thump(k*beat, -27 if k%2 else -24)
P=lambda sc,i:[p for p in T['phrases'] if p['scene']==sc][i]['start']
S={s['id']:s for s in T['scenes']}
for s in T['scenes'][1:]: whoosh(s['start'])
pop(P('hook',1)+0.5,-13,660)
for i in range(3): pop(P('struggle',3)+0.25+i*0.28,-17,700+i*120)
pop(P('dialog',1),-15,1046); pop(P('dialog',3),-15,880)
pop(S['modes']['start']+0.1,-15,784)
for i in range(1,4): pop(P('modes',i),-15,784+i*110)
for i in range(5): pop(S['premium']['start']+0.2+i*0.16,-20,523+i*80)
pop(P('premium',2)+0.1,-13,1175)
for i in range(6): pop(P('fail',1)+i*0.09,-20,500-i*40)
impact(P('fail',3)+0.5,-14)
pop(P('realize',1)+1.4,-15,330); pop(P('realize',4)+0.3,-13,1175)
impact(P('close',3),-11)
for i in range(3): pop(P('close',4)+0.5+i*0.15,-18,880+i*110)
out=out/np.abs(out).max()*0.93
sf.write('assets/mix.wav',np.stack([out,out],1).astype(np.float32),SR,subtype='PCM_16')
print('ok',round(D,2))
