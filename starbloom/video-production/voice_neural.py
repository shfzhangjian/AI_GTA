from pathlib import Path
import sys,json,asyncio,subprocess

root=Path(__file__).parent
sys.path.insert(0,str(root/'voice-deps'))
import edge_tts
audio=root/'audio';audio.mkdir(exist_ok=True)
ffmpeg='E:/videgame/tools/ffmpeg/bin/ffmpeg.exe'

async def main():
    segments=json.loads((root/'narration.json').read_text(encoding='utf-8'))
    semaphore=asyncio.Semaphore(2)
    async def build(segment):
      async with semaphore:
        for i,text in enumerate(segment['sentences']):
            mp3=audio/f"{segment['id']}-{i}-neural.mp3"
            # Standard built-in male voice; pacing is chosen for a measured game review.
            if not mp3.exists() or mp3.stat().st_size<500:
                temporary=mp3.with_suffix('.tmp.mp3')
                for attempt in range(5):
                    try:
                        await edge_tts.Communicate(text,'zh-CN-YunxiNeural',rate='+0%',pitch='-2Hz',connect_timeout=12,receive_timeout=30).save(str(temporary))
                        temporary.replace(mp3);break
                    except Exception:
                        temporary.unlink(missing_ok=True)
                        if attempt==4:raise RuntimeError('Voice service unavailable for '+segment['id']) from None
                        print('Voice connection retry: '+segment['id'],flush=True)
                        await asyncio.sleep(1)
            output=audio/f"{segment['id']}-{i}.wav"
            subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(mp3),'-ar','22050','-ac','1',str(output)],check=True)
        print('Review narration ready: '+segment['id'],flush=True)
    await asyncio.gather(*(build(segment) for segment in segments))
    (root/'voice-engine.json').write_text(json.dumps({'engine':'Microsoft Edge TTS','voice':'zh-CN-YunxiNeural','type':'standard synthetic voice','delivery':'measured game-review narration; conversational transitions; no identity imitation','audioPacing':1.0},ensure_ascii=False,indent=2),encoding='utf-8')

asyncio.run(main())
