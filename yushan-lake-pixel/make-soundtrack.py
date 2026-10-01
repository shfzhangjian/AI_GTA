"""Original synthesized ambient music for the 48-second film."""
from pathlib import Path
import wave
import numpy as np

root=Path(__file__).resolve().parent
sample_rate=44100
duration=48
rng=np.random.default_rng(807)
sound=np.zeros((sample_rate*duration,2),dtype=np.float64)
notes=[130.8128,164.8138,195.9977,261.6256,293.6648,329.6276]
sequence=[0,2,3,1,4,2,5,3,0,2,4,1,3,5,2,4]
for i in range(24):
    start=i*2
    length=min(5,duration-start)
    t=np.arange(length*sample_rate)/sample_rate
    f=notes[sequence[i%len(sequence)]]
    env=(1-np.exp(-t*3))*np.exp(-t*.95)*np.minimum(1,(length-t)/.3)
    tone=(np.sin(2*np.pi*f*t)+.24*np.sin(2*np.pi*2*f*t)+.09*np.sin(2*np.pi*3*f*t))*env*.12
    pan=.35+.3*(i%3)/2
    sound[start*sample_rate:start*sample_rate+len(t),0]+=tone*(1-pan)
    sound[start*sample_rate:start*sample_rate+len(t),1]+=tone*pan
    if i%4==0:
        shimmer=np.sin(2*np.pi*f*4*t)*np.exp(-t*2.1)*np.minimum(1,t*8)*.018
        sound[start*sample_rate:start*sample_rate+len(t)]+=shimmer[:,None]
noise=rng.normal(0,1,len(sound))
noise=np.convolve(noise,np.ones(90)/90,mode='same')*.035
sound+=noise[:,None]
t=np.arange(len(sound))/sample_rate
fade=np.minimum(1,t/1.5)*np.minimum(1,(duration-t)/2.5)
sound*=fade[:,None]
output=root/'exports'/'original-ambient.wav'
output.parent.mkdir(exist_ok=True)
with wave.open(str(output),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(sample_rate)
    f.writeframes((np.clip(sound,-1,1)*32767).astype('<i2').tobytes())
print(output)
