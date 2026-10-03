from pathlib import Path
import shutil

source = Path('E:/videgame/starbloom-source/starbloom/dist')
target = Path('E:/videgame/starbloom-video/capture')
shutil.copytree(source, target, dirs_exist_ok=True)
game = (target / 'game.js').read_text(encoding='utf-8')
game = game.replace('sim.update(dt,{x:', 'sim.update(dt,window.__recordInput?.()??{x:')
game = game.replace('renderer.render(scene,camera);requestAnimationFrame(frame)', 'renderer.render(scene,camera);window.__recordFrame?.(now);requestAnimationFrame(frame)')
game += '\nexport {sim,state,start,selectUpgrade,launch,showMap,snapshot};\n'
(target / 'game.js').write_text(game, encoding='utf-8')
index = (target / 'index.html').read_text(encoding='utf-8')
index = index.replace('</body>', '<script type="module" src="recorder.js"></script></body>')
(target / 'index.html').write_text(index, encoding='utf-8')
shutil.copy2(Path(__file__).parent / 'recorder.js', target / 'recorder.js')
print('Prepared isolated capture build; original gameplay source is unchanged.')
