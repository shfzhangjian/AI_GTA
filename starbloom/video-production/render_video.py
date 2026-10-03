from pathlib import Path
import json, subprocess, wave, math, sys
import numpy as np
from PIL import Image, ImageDraw

root=Path(__file__).parent
out=root/'exports';out.mkdir(exist_ok=True)
ffmpeg='E:/videgame/tools/ffmpeg/bin/ffmpeg.exe'
ffprobe='E:/videgame/tools/ffmpeg/bin/ffprobe.exe'
segments=json.loads((root/'narration.json').read_text(encoding='utf-8'))

def run(args):
    p=subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y']+args,capture_output=True,text=True,cwd=out)
    if p.returncode:raise RuntimeError(p.stderr)

def stamp(t):
    n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'

engine=json.loads((root/'voice-engine.json').read_text(encoding='utf-8')) if (root/'voice-engine.json').exists() else {'voice':'Windows Microsoft Huihui Desktop','audioPacing':1.13}
audio=[];subs=[];chapters=[];timeline=0;speed=engine.get('audioPacing',1.0);sample_rate=22050
def silence(d):return np.zeros(round(d*sample_rate),dtype=np.int16)
for seg in segments:
    start=timeline;audio.append(silence(.35));timeline+=.35
    for i,text in enumerate(seg['sentences']):
        source=root/'audio'/f"{seg['id']}-{i}.wav";processed=root/'audio'/f"{seg['id']}-{i}-paced.wav"
        run(['-i',str(source),'-af',f'atempo={speed}','-ar',str(sample_rate),'-ac','1',str(processed)])
        with wave.open(str(processed),'rb') as w:pcm=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).copy()
        duration=len(pcm)/sample_rate
        # Split long subtitles at punctuation for comfortable 720p reading.
        import re
        parts=[x for x in re.split(r'(?<=[，。！；])',text) if x]
        groups=[];line=''
        for p in parts:
            if len(line)+len(p)>27 and line:groups.append(line);line=p
            else:line+=p
        if line:groups.append(line)
        cursor=timeline
        for line in groups:
            d=duration*len(line)/len(text);subs.append((cursor,cursor+d,line));cursor+=d
        audio.append(pcm);audio.append(silence(.20));timeline+=duration+.20
    audio.append(silence(.45));timeline+=.45
    seg['start']=start;seg['duration']=timeline-start;chapters.append({'start':round(start,3),'duration':round(timeline-start,3),'title':seg['title']})

pcm=np.concatenate(audio)
with wave.open(str(out/'narration.wav'),'wb') as w:w.setparams((1,2,sample_rate,len(pcm),'NONE','not compressed'));w.writeframes(pcm.tobytes())
(out/'subtitles.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(a)} --> {stamp(b)}\n{text}' for i,(a,b,text) in enumerate(subs))+'\n',encoding='utf-8')
(out/'chapters.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2),encoding='utf-8')

# Cuts use actual captured frames at the original gameplay speed. Short UI shots
# hold their last frame for the voiceover instead of changing gameplay speed.
shots={
 'intro':[(.2,3.0),(6.2,8),(77,12)],
 'movement':[(6.2,20)],
 'combat':[(15,12),(119,12)],
 'upgrade':[(29.55,2.9),(66.42,2.9),(118,18)],
 'river':[(32.95,4.5),(42,18)],
 'ice':[(77,15)],
 'forest':[(118,16)],
 'volcano':[(159,16)],
 'ending':[(195.65,4.4)]
}
files=[]
for index,seg in enumerate(segments):
    clips=[];remaining=seg['duration']
    for j,(seek,d) in enumerate(shots[seg['id']]):
        if remaining<=0:break
        take=min(d,remaining);target=out/f'part-{index}-{j}.mp4'
        pad=max(0,remaining-take) if j==len(shots[seg['id']])-1 else 0
        total=take+pad
        if '--finalize-only' not in sys.argv or not target.exists():
            run(['-ss',str(seek),'-i',str(root/'raw.webm'),'-t',str(total),'-an','-vf',f'trim=duration={take},setpts=PTS-STARTPTS,fps=30,tpad=stop_mode=clone:stop_duration={pad+0.2}','-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-threads','4',str(target)])
        files.append(target);remaining-=total;clips.append({'sourceStart':seek,'sourceDuration':take,'hold':pad})
    seg['shots']=clips
    print(f"Encoded {seg['id']}: {seg['duration']:.1f}s",flush=True)

concat=out/'cuts.txt';concat.write_text('\n'.join("file '"+p.as_posix()+"'" for p in files),encoding='utf-8')
run(['-f','concat','-safe','0','-i',str(concat),'-c','copy',str(out/'montage.mp4')])
# Overlay the shared transcript below the gameplay focal area, above controls.
style="FontName=Microsoft YaHei,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00100B08,BackColour=&H900D0906,BorderStyle=3,Outline=2,Shadow=0,MarginV=52,Alignment=2"
run(['-i',str(out/'montage.mp4'),'-i',str(out/'narration.wav'),'-vf',f"subtitles=filename='subtitles.srt':force_style='{style}'",'-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-af','loudnorm=I=-16:TP=-1.5:LRA=7','-ar','48000','-c:a','aac','-b:a','128k','-movflags','+faststart','-t',str(timeline),'-threads','4',str(out/'starbloom-introduction.mp4')])
probe=json.loads(subprocess.check_output([ffprobe,'-v','error','-show_format','-show_streams','-of','json',str(out/'starbloom-introduction.mp4')]))
report={'duration':timeline,'audio':engine,'footage':'actual browser WebGL rendering with automated controls; normal simulation; UI labels composited for video','chapters':chapters,'segments':segments,'probe':probe}
(out/'video-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
times=[.5]+[s['start']+min(s['duration']/2,6) for s in segments[1:]]
thumbs=[]
for i,t in enumerate(times):
    path=out/f'review-{i}.jpg';run(['-ss',str(t),'-i',str(out/'starbloom-introduction.mp4'),'-frames:v','1',str(path)])
    im=Image.open(path);im.thumbnail((426,240));thumbs.append(im.copy())
sheet=Image.new('RGB',(1278,720),'#06101e')
for i,im in enumerate(thumbs):sheet.paste(im,((i%3)*426,(i//3)*240))
sheet.save(out/'contact-sheet.jpg',quality=92)
print(json.dumps({'duration':round(timeline,2),'video':str(out/'starbloom-introduction.mp4'),'bytes':(out/'starbloom-introduction.mp4').stat().st_size}),flush=True)
