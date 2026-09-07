import { LEVELS, SKILLS, UPGRADES } from './config.js';

export class GameUI {
  constructor(state, actions) {
    this.state = state;
    this.actions = actions;
    this.nodes = {
      coins: document.querySelector('#coin-count'),
      gourd: document.querySelector('#gourd-count'),
      jade: document.querySelector('#jade-count'),
      levelName: document.querySelector('#level-name'),
      sealFill: document.querySelector('#seal-fill'),
      sealLabel: document.querySelector('#seal-label'),
      grandpa: document.querySelector('#grandpa-status'),
      damage: document.querySelector('#damage-stat'),
      speed: document.querySelector('#speed-stat'),
      crit: document.querySelector('#crit-stat'),
      note: document.querySelector('#combat-note'),
      bottomPanel: document.querySelector('#bottom-panel'),
      panelToggle: document.querySelector('#panel-toggle'),
      panelToggleIcon: document.querySelector('#panel-toggle-icon'),
      panelToggleText: document.querySelector('#panel-toggle-text'),
      upgrades: document.querySelector('#upgrade-board'),
      skills: document.querySelector('#skill-board'),
      logs: document.querySelector('#log-lines'),
      startScreen: document.querySelector('#start-screen'),
      resultScreen: document.querySelector('#result-screen'),
      resultKicker: document.querySelector('#result-kicker'),
      resultTitle: document.querySelector('#result-title'),
      resultCopy: document.querySelector('#result-copy'),
      startButton: document.querySelector('#start-button'),
      restartButton: document.querySelector('#restart-button'),
      pauseButton: document.querySelector('#pause-button'),
      resultRestart: document.querySelector('#result-restart'),
      soundButton: document.querySelector('#sound-button'),
    };
    this.logLines = [];
    this.raf = null;
    this.panelCollapsed = readPanelPreference();
    this.bind();
    this.renderCards();
    this.renderPanelToggle();
    this.pushLog('青藤已醒。');
  }

  bind() {
    this.nodes.startButton.addEventListener('click', this.actions.onStart);
    this.nodes.restartButton.addEventListener('click', this.actions.onRestart);
    this.nodes.pauseButton.addEventListener('click', this.actions.onPause);
    this.nodes.resultRestart.addEventListener('click', this.actions.onRestart);
    this.nodes.panelToggle.addEventListener('click', () => this.togglePanel());
    this.nodes.soundButton.addEventListener('click', () => {
      this.actions.onToggleSound();
      this.renderSoundButton();
    });
    window.addEventListener('resize', () => this.syncPanelHeight());

    this.state.addEventListener('change', () => this.render());
    this.state.addEventListener('upgrade', (event) => {
      const upgrade = UPGRADES.find((item) => item.id === event.detail.id);
      this.pushLog(`${upgrade.name} 升到 ${event.detail.level} 级。`);
    });
    this.state.addEventListener('skill-unlocked', (event) => {
      const skill = SKILLS.find((item) => item.id === event.detail.id);
      this.pushLog(`${skill.name} 入阵，可施展 ${skill.title}。`);
    });
    this.state.addEventListener('lost', () => {
      this.showResult('营救失败', '封印反噬，爷爷被拖回洞府。', '战局');
    });
    this.state.addEventListener('won', () => {
      this.showResult('爷爷得救', `总战绩 ${this.state.score}，山玉 ${this.state.jade}。`, '胜利');
    });
    this.state.addEventListener('level-change', () => {
      this.pushLog(`${this.state.level.name} 已开启。`);
    });
    this.state.addEventListener('denied', () => {
      this.nodes.note.textContent = '灵豆或葫芦气不足。';
      window.setTimeout(() => {
        this.nodes.note.textContent = this.getPhaseNote();
      }, 900);
    });
  }

  start() {
    const loop = () => {
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  renderCards() {
    this.nodes.upgrades.innerHTML = '';
    this.nodes.skills.innerHTML = '';

    for (const upgrade of UPGRADES) {
      const card = document.createElement('article');
      card.className = 'upgrade-card';
      card.dataset.upgrade = upgrade.id;
      card.innerHTML = `
        <div class="card-title">
          <strong>${upgrade.name}</strong>
          <span data-role="level">Lv.0</span>
        </div>
        <p>${upgrade.description}</p>
        <button type="button" data-role="buy">升级</button>
      `;
      card.querySelector('button').addEventListener('click', () => this.actions.onUpgrade(upgrade.id));
      this.nodes.upgrades.append(card);
    }

    for (const skill of SKILLS) {
      const card = document.createElement('article');
      card.className = 'skill-card';
      card.dataset.skill = skill.id;
      card.innerHTML = `
        <div class="card-title">
          <strong>${skill.name}</strong>
          <span data-role="cooldown">待命</span>
        </div>
        <p>${skill.title}：${skill.description}</p>
        <button type="button" data-role="cast">施放</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (this.state.isSkillUnlocked(skill.id)) {
          this.actions.onCastSkill(skill.id);
        } else {
          this.actions.onUnlockSkill(skill.id);
        }
      });
      this.nodes.skills.append(card);
    }
  }

  render() {
    const arrow = this.state.getArrowStats();
    const resource = this.state.getResourceStats();
    const sealRatio = this.state.sealMax > 0 ? this.state.sealHp / this.state.sealMax : 0;

    this.nodes.coins.textContent = formatNumber(this.state.coins);
    this.nodes.gourd.textContent = `${Math.floor(this.state.gourd)}/${resource.gourdMax}`;
    this.nodes.jade.textContent = this.state.jade;
    this.nodes.levelName.textContent = this.state.level?.name ?? '终局';
    this.nodes.sealFill.style.transform = `scaleX(${Math.max(0, sealRatio)})`;
    this.nodes.sealLabel.textContent = `封印 ${Math.ceil(Math.max(0, sealRatio) * 100)}%`;
    this.nodes.grandpa.textContent = `爷爷安危 ${Math.ceil(this.state.grandpaHp)}%`;
    this.nodes.damage.textContent = `伤害 ${arrow.damage}`;
    this.nodes.speed.textContent = `箭速 ${arrow.speed}`;
    this.nodes.crit.textContent = `会心 ${Math.round(arrow.critChance * 100)}%`;
    this.nodes.note.textContent = this.getPhaseNote();
    this.nodes.pauseButton.textContent = this.state.phase === 'paused' ? '继续' : '暂停';
    this.nodes.pauseButton.disabled = !['playing', 'paused'].includes(this.state.phase);
    this.renderSoundButton();
    this.nodes.startScreen.classList.toggle('hidden', this.state.phase !== 'ready');
    this.nodes.resultScreen.classList.toggle('hidden', !['won', 'lost'].includes(this.state.phase));

    this.renderUpgradeState();
    this.renderSkillState();
  }

  renderUpgradeState() {
    for (const upgrade of UPGRADES) {
      const card = this.nodes.upgrades.querySelector(`[data-upgrade="${upgrade.id}"]`);
      const level = this.state.getUpgradeLevel(upgrade.id);
      const cost = this.state.getUpgradeCost(upgrade.id);
      const button = card.querySelector('button');
      card.querySelector('[data-role="level"]').textContent = `Lv.${level}/${upgrade.max}`;
      button.textContent = level >= upgrade.max ? '已满级' : `${cost} 灵豆`;
      button.disabled = level >= upgrade.max || this.state.coins < cost;
    }
  }

  renderSkillState() {
    for (const skill of SKILLS) {
      const card = this.nodes.skills.querySelector(`[data-skill="${skill.id}"]`);
      const cooldown = this.state.cooldowns[skill.id] ?? 0;
      const unlocked = this.state.isSkillUnlocked(skill.id);
      const canCast = this.state.canUseSkill(skill.id);
      const button = card.querySelector('button');
      const label = card.querySelector('[data-role="cooldown"]');

      card.classList.toggle('locked', !unlocked);
      card.classList.toggle('ready', canCast);
      card.classList.toggle('cooling', unlocked && cooldown > 0);

      if (!unlocked) {
        const availableLevel = this.state.levelIndex >= skill.minLevel;
        label.textContent = availableLevel ? '未入阵' : `第${skill.minLevel + 1}关`;
        button.textContent = `${skill.unlockCost} 灵豆`;
        button.disabled = !this.state.canUnlockSkill(skill.id);
        continue;
      }

      label.textContent = cooldown > 0 ? `${cooldown.toFixed(1)}s` : '待命';
      button.textContent = canCast ? `${skill.cost} 气` : cooldown > 0 ? '回气中' : `${skill.cost} 气`;
      button.disabled = !canCast;
    }
  }

  pushLog(message) {
    this.logLines.unshift(message);
    this.logLines = this.logLines.slice(0, 5);
    this.nodes.logs.innerHTML = '';
    for (const line of this.logLines) {
      const node = document.createElement('p');
      node.textContent = line;
      this.nodes.logs.append(node);
    }
  }

  showResult(title, copy, kicker) {
    this.nodes.resultKicker.textContent = kicker;
    this.nodes.resultTitle.textContent = title;
    this.nodes.resultCopy.textContent = copy;
  }

  renderSoundButton() {
    const enabled = this.actions.isSoundEnabled();
    this.nodes.soundButton.textContent = enabled ? '音效开' : '音效关';
    this.nodes.soundButton.setAttribute('aria-label', enabled ? '关闭音效' : '开启音效');
  }

  togglePanel() {
    this.panelCollapsed = !this.panelCollapsed;
    writePanelPreference(this.panelCollapsed);
    this.renderPanelToggle();
  }

  renderPanelToggle() {
    const collapsed = this.panelCollapsed;
    this.syncPanelHeight();
    this.nodes.bottomPanel.classList.toggle('is-collapsed', collapsed);
    this.nodes.panelToggle.classList.toggle('is-collapsed', collapsed);
    this.nodes.panelToggle.setAttribute('aria-expanded', String(!collapsed));
    this.nodes.panelToggle.setAttribute('aria-label', collapsed ? '展开底部属性' : '收起底部属性');
    this.nodes.panelToggleIcon.textContent = collapsed ? '⌃' : '⌄';
    this.nodes.panelToggleText.textContent = collapsed ? '展开' : '收起';
  }

  syncPanelHeight() {
    const height = this.nodes.bottomPanel.offsetHeight;
    document.documentElement.style.setProperty('--bottom-panel-height', `${height}px`);
  }

  getPhaseNote() {
    if (this.state.phase === 'ready') {
      return '按住预览落点，松手放箭。';
    }
    if (this.state.phase === 'paused') {
      return '战局暂停。';
    }
    if (this.state.phase === 'won') {
      return '石门已开。';
    }
    if (this.state.phase === 'lost') {
      return '弓阵已破。';
    }
    return this.state.hasBuff('focus') ? '弱点显现，箭箭追心。' : '按住预览落点，松手放箭。';
  }
}

function formatNumber(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return Math.floor(value).toString();
}

function readPanelPreference() {
  try {
    return window.localStorage.getItem('huluwa-bottom-panel') === 'collapsed';
  } catch {
    return false;
  }
}

function writePanelPreference(collapsed) {
  try {
    window.localStorage.setItem('huluwa-bottom-panel', collapsed ? 'collapsed' : 'expanded');
  } catch {
    // Ignore private browsing storage restrictions.
  }
}
