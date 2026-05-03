// ── Constants ──────────────────────────────────────────────────────────────────
const CIRC = 2 * Math.PI * 130;
const BREAK_VIDEOS = [
    // fireworks celebrations (~1-3 min clips)
    'A69pST5fFo0', 'cdKop6NKAJA', 'BgFJPp4F4e0', 'fqeB3XcuN7s', 'S0y3s4KP88g',
    // sports championship moments (~1-4 min clips)
    'lAIGb1lfpBw', 'jKDgFWKJFMk', 'e_X3QKQV5kI', '7yBPWMXkN0k', 'M7lc1UVf-VE',
    // crowd celebrations and confetti (~1-3 min clips)
    '4T1FRDlcJeA', 'vnvFjl3KMbM', 'k2KPgWWvYXE', 'GBZCzyfJGsM', 'OfDHFYzuAhk'
];

// ── State ──────────────────────────────────────────────────────────────────────
let tS = 'idle', tM = 'focus', tR = 0, tT = 0, tI = null;
let cfg = { focusMin: 25, breakMin: 5 };
let tasks = [], daily = {}, skills = [], activeSkill = '', curUser = null;
let editSkillId = null, delSkillId = null;

// ── Utilities ──────────────────────────────────────────────────────────────────
function dk(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function l7() {
    const a = [], labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        a.push({ key: dk(d), label: labels[d.getDay()], today: i === 0 });
    }
    return a;
}

function ft(s) {
    const m = Math.floor(s / 60);
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function fd(s) {
    if (!s || s <= 0) return '0 min';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? h + 'h ' + m + 'min' : m + 'min';
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function togPw(id, btn) {
    const inp = document.getElementById(id);
    const ic = btn.querySelector('i');
    if (inp.type === 'password') {
        inp.type = 'text';
        ic.className = 'fa-solid fa-eye-slash text-sm';
    } else {
        inp.type = 'password';
        ic.className = 'fa-solid fa-eye text-sm';
    }
}

function updStr() {
    const pw = document.getElementById('r-pw').value;
    let sc = 0;
    if (pw.length >= 6) sc++;
    if (pw.length >= 10) sc++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) sc++;
    if (/\d/.test(pw)) sc++;
    if (/[^A-Za-z0-9]/.test(pw)) sc++;
    const n = Math.min(Math.ceil(sc * .8), 4);
    const cls = n <= 1 ? 's1' : n <= 2 ? 's2' : 's3';
    const lbl = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
    for (let i = 1; i <= 4; i++) {
        document.getElementById('s' + i).className = 'str-bar flex-1' + (i <= n ? ' ' + cls : '');
    }
    const el = document.getElementById('s-lbl');
    el.textContent = pw.length > 0 ? lbl[n] : '';
    el.style.color = n <= 1 ? 'var(--danger)' : n <= 2 ? 'var(--warn)' : 'var(--accent)';
}

function beep() {
    try {
        const c = new (window.AudioContext || window.webkitAudioContext)();
        [0, .18, .36].forEach(d => {
            const o = c.createOscillator(), g = c.createGain();
            o.connect(g); g.connect(c.destination);
            o.frequency.value = 880; o.type = 'sine';
            g.gain.setValueAtTime(.2, c.currentTime + d);
            g.gain.exponentialRampToValueAtTime(.001, c.currentTime + d + .12);
            o.start(c.currentTime + d); o.stop(c.currentTime + d + .12);
        });
    } catch (e) {}
}

function toast(msg, type) {
    type = type || 'info';
    const box = document.getElementById('toast-box');
    while (box.children.length >= 3) box.removeChild(box.firstChild);
    const ic = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = '<i class="fa-solid ' + (ic[type] || ic.info) + '"></i><span>' + msg + '</span>';
    box.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => { if (el.parentNode) el.remove(); }, 400);
    }, 3500);
}

// ── Auth ───────────────────────────────────────────────────────────────────────
async function doRegister() {
    const u = document.getElementById('r-user');
    const p = document.getElementById('r-pw');
    const p2 = document.getElementById('r-pw2');
    const username = u.value.trim().toLowerCase();
    const password = p.value;
    const pw2 = p2.value;

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        toast('Usuário: 3-30 chars, letras/números/_.', 'error');
        u.focus(); return;
    }
    if (password.length < 6) {
        toast('Senha: mínimo 6 caracteres.', 'error');
        p.focus(); return;
    }
    if (password !== pw2) {
        toast('Senhas não coincidem.', 'error');
        p2.focus(); return;
    }

    try {
        await api.register(username, password);
        curUser = username;
        sessionStorage.setItem('ff_user', username);
        await loadUser();
        enterApp();
        toast('Conta criada! Bem-vindo(a), ' + username + '.', 'success');
    } catch (err) {
        const msg = err?.detail || 'Erro ao criar conta.';
        toast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    }
}

async function doLogin() {
    const u = document.getElementById('l-user');
    const p = document.getElementById('l-pw');
    const username = u.value.trim().toLowerCase();
    const password = p.value;

    if (!username) { toast('Digite o usuário.', 'error'); u.focus(); return; }
    if (!password) { toast('Digite a senha.', 'error'); p.focus(); return; }

    try {
        await api.login(username, password);
        curUser = username;
        sessionStorage.setItem('ff_user', username);
        await loadUser();
        enterApp();
        toast('Bem-vindo(a) de volta, ' + username + '!', 'success');
    } catch (err) {
        const msg = err?.detail || 'Usuário ou senha incorretos.';
        toast(typeof msg === 'string' ? msg : JSON.stringify(msg), 'error');
    }
}

async function doLogout() {
    try { await api.logout(); } catch (e) {}
    sessionStorage.removeItem('ff_user');
    clearInterval(tI); tI = null;
    tS = 'idle'; tM = 'focus';
    curUser = null; tasks = []; skills = []; daily = {}; activeSkill = '';
    setTheme('dark');
    document.getElementById('page-app').style.display = 'none';
    document.getElementById('page-auth').style.display = 'flex';
    document.getElementById('l-user').value = '';
    document.getElementById('l-pw').value = '';
}

function showAuth(w) {
    const tl = document.getElementById('tab-login');
    const tr = document.getElementById('tab-reg');
    const fl = document.getElementById('form-login');
    const fr = document.getElementById('form-reg');
    if (w === 'login') {
        tl.classList.add('active'); tr.classList.remove('active');
        fl.style.display = 'block'; fr.style.display = 'none';
    } else {
        tr.classList.add('active'); tl.classList.remove('active');
        fr.style.display = 'block'; fl.style.display = 'none';
    }
}

async function checkSess() {
    try {
        await api.getConfig();
        curUser = sessionStorage.getItem('ff_user') || '';
        await loadUser();
        enterApp();
    } catch (e) {
        document.getElementById('page-auth').style.display = 'flex';
    }
}

// ── App entry ──────────────────────────────────────────────────────────────────
async function loadUser() {
    const [tasksData, skillsData, configData, dailyData] = await Promise.all([
        api.getTasks(),
        api.getSkills(),
        api.getConfig(),
        api.getDaily()
    ]);

    tasks = tasksData.map(t => ({
        id: t.id,
        text: t.text,
        skillId: t.skill_id || null,
        done: t.done,
        doneAt: t.done_at || null
    }));

    skills = skillsData.map(s => ({
        id: s.id,
        name: s.name,
        xp: s.xp || 0,
        isActive: s.is_active || false
    }));

    const activeSkillObj = skills.find(s => s.isActive);
    activeSkill = activeSkillObj ? activeSkillObj.id : '';

    if (configData) {
        if (typeof configData.focus_min === 'number') cfg.focusMin = configData.focus_min;
        if (typeof configData.break_min === 'number') cfg.breakMin = configData.break_min;
    }

    daily = {};
    if (Array.isArray(dailyData)) {
        dailyData.forEach(d => { daily[d.date] = d.seconds; });
    }
}

function enterApp() {
    document.getElementById('page-auth').style.display = 'none';
    document.getElementById('page-app').style.display = 'flex';
    document.getElementById('u-disp').textContent = curUser;
    document.getElementById('storage-warn').style.display = 'none';
    tT = cfg.focusMin * 60;
    tR = tT;
    renderCfg();
    renderTimer();
    renderTasks();
    renderSkills();
    renderStats();
}

// ── Theme ──────────────────────────────────────────────────────────────────────
function setTheme(t) { document.body.setAttribute('data-theme', t); }

function applyTmTheme() {
    if (tS === 'idle') { setTheme('dark'); return; }
    setTheme(tM === 'break' ? 'light' : 'dark');
}

// ── Timer ──────────────────────────────────────────────────────────────────────
function handleTog() { if (tS === 'running') pauseTm(); else startTm(); }

function startTm() {
    if (tS === 'running') return;
    if (tS === 'idle') { tM = 'focus'; tT = cfg.focusMin * 60; tR = tT; }
    tS = 'running';
    tI = setInterval(tick, 1000);
    renderTimer(); applyTmTheme();
}

function pauseTm() {
    if (tS !== 'running') return;
    tS = 'paused';
    clearInterval(tI); tI = null;
    renderTimer();
}

function resetTm() {
    clearInterval(tI); tI = null;
    tS = 'idle'; tM = 'focus';
    tT = cfg.focusMin * 60; tR = tT;
    closeBreakVideo();
    renderTimer(); applyTmTheme();
}

function openBreakVideo() {
    const id = BREAK_VIDEOS[Math.floor(Math.random() * BREAK_VIDEOS.length)];
    document.getElementById('break-video-iframe').src =
        'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&end=300';
    document.getElementById('break-video-timer').textContent = ft(tR);
    document.getElementById('m-break-video').style.display = 'flex';
}

function closeBreakVideo() {
    document.getElementById('m-break-video').style.display = 'none';
    document.getElementById('break-video-iframe').src = '';
}

function tick() {
    tR--;
    if (tR <= 0) { tR = 0; onComplete(); return; }
    renderTimer();
}

async function onComplete() {
    clearInterval(tI); tI = null;
    beep();

    if (tM === 'focus') {
        const today = dk();
        daily[today] = (daily[today] || 0) + tT;
        renderStats();

        const xpGain = cfg.focusMin * 10;

        try {
            await api.saveDaily(today, daily[today]);
        } catch (e) {
            console.error('Erro ao salvar daily:', e);
        }

        if (activeSkill) {
            const skill = skills.find(s => s.id === activeSkill);
            if (skill) {
                try {
                    const updated = await api.addXp(activeSkill, xpGain);
                    skill.xp = updated.xp;
                    renderSkills();
                    toast('+' + xpGain + ' XP para ' + skill.name + '!', 'success');
                } catch (e) {
                    toast('+' + xpGain + ' XP (skill não encontrada)', 'info');
                }
            } else {
                toast('+' + xpGain + ' XP (skill não encontrada)', 'info');
            }
        } else {
            toast('Foco concluído! Selecione uma skill para ganhar XP.', 'info');
        }

        tM = 'break'; tT = cfg.breakMin * 60; tR = tT;
        toast('Hora do descanso!', 'success');
    } else {
        tM = 'focus'; tT = cfg.focusMin * 60; tR = tT;
        toast('Descanso concluído!', 'info');
    }

    tS = 'paused';
    renderTimer(); applyTmTheme();
    if (tM === 'break') { openBreakVideo(); startTm(); }
    else { closeBreakVideo(); }
}

function renderTimer() {
    const d = document.getElementById('timer-display');
    const l = document.getElementById('timer-label');
    const bg = document.getElementById('mode-badge');
    const mt = document.getElementById('mode-text');
    const pg = document.getElementById('timer-prog');
    const bt = document.getElementById('btn-tog');

    d.textContent = ft(tR);
    l.textContent = tS === 'idle' ? 'Pronto para focar'
        : tS === 'running' ? (tM === 'focus' ? 'Mantenha o foco...' : 'Descanse um pouco...')
        : (tM === 'focus' ? 'Pausado — Foco' : 'Pausado — Descanso');

    bg.className = 'mode-badge ' + (tM === 'focus' ? 'focus' : 'brk');
    mt.textContent = tM === 'focus' ? 'Foco' : 'Descanso';
    bg.querySelector('i').className = 'fa-solid ' + (tM === 'focus' ? 'fa-bolt' : 'fa-mug-hot');
    bg.querySelector('i').style.fontSize = '.62rem';

    pg.style.strokeDashoffset = tS === 'idle' ? CIRC : CIRC * (1 - (tT > 0 ? tR / tT : 0));
    pg.classList.toggle('brk', tM === 'break');
    pg.classList.toggle('run', tS === 'running');

    d.style.color = tM === 'break' && tS !== 'idle' ? 'var(--brk)' : 'var(--fg)';
    bt.innerHTML = tS === 'running'
        ? '<i class="fa-solid fa-pause" style="font-size:.7rem"></i><span>Pausar</span>'
        : '<i class="fa-solid fa-play" style="font-size:.7rem"></i><span>Iniciar</span>';

    document.title = tS === 'running' ? ft(tR) + ' — FocusFlow' : 'FocusFlow';

    const bvt = document.getElementById('break-video-timer');
    if (bvt) bvt.textContent = ft(tR);
}

// ── Config ─────────────────────────────────────────────────────────────────────
async function applyCfg() {
    const fi = document.getElementById('inp-f');
    const bi = document.getElementById('inp-b');
    const fv = parseInt(fi.value, 10);
    const bv = parseInt(bi.value, 10);

    if (isNaN(fv) || fv < 1 || fv > 120) { toast('Foco: 1-120 min.', 'error'); fi.focus(); return; }
    if (isNaN(bv) || bv < 1 || bv > 60) { toast('Descanso: 1-60 min.', 'error'); bi.focus(); return; }

    cfg.focusMin = fv; cfg.breakMin = bv;

    try {
        await api.saveConfig(fv, bv);
    } catch (e) {
        toast('Erro ao salvar configurações.', 'error');
        return;
    }

    renderCfg();
    if (tS === 'idle') {
        tT = cfg.focusMin * 60; tR = tT;
        renderTimer();
        toast('Configurações aplicadas.', 'success');
    } else {
        toast('Salvo! Vigora no próximo ciclo.', 'info');
    }
}

function renderCfg() {
    document.getElementById('inp-f').value = cfg.focusMin;
    document.getElementById('inp-b').value = cfg.breakMin;
    document.getElementById('c-fd').textContent = cfg.focusMin + ' min';
    document.getElementById('c-bd').textContent = cfg.breakMin + ' min';
    document.getElementById('c-td').textContent = (cfg.focusMin + cfg.breakMin) + ' min';
}

// ── Skills ─────────────────────────────────────────────────────────────────────
const S = {
    getLevel(xp) { return Math.max(0, Math.floor(Math.sqrt(xp / 100))); },
    xpFor(lv) { return lv * lv * 100; },
    progress(xp) {
        const lv = this.getLevel(xp), cur = this.xpFor(lv), nxt = this.xpFor(lv + 1);
        return nxt > cur ? (xp - cur) / (nxt - cur) : 1;
    },
    lvClass(lv) { return lv <= 2 ? 'lv-low' : lv <= 5 ? 'lv-mid' : lv <= 9 ? 'lv-high' : 'lv-max'; },
    taskCount(id) { return tasks.filter(t => t.skillId === id).length; },
    async setActive(id) {
        activeSkill = id;
        if (id) {
            try { await api.setActiveSkill(id); } catch (e) {}
        }
    },
    renderSelect() {
        const sel = document.getElementById('active-skill');
        sel.innerHTML = '<option value="">Selecione uma skill</option>';
        skills.forEach(s => {
            const o = document.createElement('option');
            o.value = s.id;
            o.textContent = s.name + (s.xp > 0 ? ' (Lv.' + this.getLevel(s.xp) + ')' : '');
            if (s.id === activeSkill) o.selected = true;
            sel.appendChild(o);
        });
    }
};

function openSkillModal(id) {
    editSkillId = id || null;
    document.getElementById('m-sk-title').textContent = id ? 'Editar Skill' : 'Nova Skill';
    const inp = document.getElementById('m-sk-name');
    if (id) {
        const s = skills.find(x => x.id == id);
        inp.value = s ? s.name : '';
    } else {
        inp.value = '';
    }
    document.getElementById('m-skill').style.display = 'flex';
    setTimeout(() => inp.focus(), 100);
}

function closeSkillM() {
    document.getElementById('m-skill').style.display = 'none';
    editSkillId = null;
}

async function saveSkill() {
    const inp = document.getElementById('m-sk-name');
    const name = inp.value.trim();
    if (!name) { toast('Digite o nome da skill.', 'error'); inp.focus(); return; }

    if (editSkillId) {
        const s = skills.find(x => x.id === editSkillId);
        if (s) {
            s.name = name;
            renderSkills(); renderTasks(); S.renderSelect();
            toast('Skill atualizada.', 'success');
        }
    } else {
        try {
            const newSkill = await api.createSkill(name);
            skills.push({ id: newSkill.id, name: newSkill.name, xp: newSkill.xp || 0 });
            renderSkills(); S.renderSelect();
            toast('Skill criada!', 'success');
        } catch (e) {
            toast('Erro ao criar skill.', 'error');
            return;
        }
    }

    closeSkillM();
}

function openDelM(id) {
    delSkillId = id;
    const s = skills.find(x => x.id == id);
    if (!s) return;
    document.getElementById('del-name').textContent = '"' + s.name + '"';
    document.getElementById('del-lv').textContent = S.getLevel(s.xp);
    document.getElementById('del-xp').textContent = s.xp + ' XP';
    const tc = S.taskCount(id);
    const el = document.getElementById('del-tasks');
    el.textContent = tc + (tc === 1 ? ' tarefa' : ' tarefas');
    el.style.color = tc > 0 ? 'var(--warn)' : 'var(--accent)';
    document.getElementById('m-del').style.display = 'flex';
}

function closeDelM() {
    document.getElementById('m-del').style.display = 'none';
    delSkillId = null;
}

async function execDelSkill() {
    if (!delSkillId) return;

    try {
        const affectedTasks = tasks.filter(t => t.skillId == delSkillId);
        await Promise.all(affectedTasks.map(t => api.updateTask(t.id, { skill_id: null })));
        affectedTasks.forEach(t => { t.skillId = null; });

        await api.deleteSkill(delSkillId);
        skills = skills.filter(s => s.id != delSkillId);

        if (activeSkill === delSkillId) activeSkill = '';

        closeDelM();
        renderSkills(); renderTasks(); S.renderSelect();
        toast('Skill excluída.', 'info');
    } catch (e) {
        toast('Erro ao excluir skill.', 'error');
        closeDelM();
    }
}

function renderSkills() {
    const grid = document.getElementById('sk-grid');
    const empty = document.getElementById('sk-empty');
    if (skills.length === 0) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    grid.innerHTML = skills.map(s => {
        const lv = S.getLevel(s.xp), prog = S.progress(s.xp), cls = S.lvClass(lv);
        const curXp = S.xpFor(lv), nxtXp = S.xpFor(lv + 1);
        const tc = S.taskCount(s.id);
        const xpText = lv > 0 ? (s.xp - curXp) + ' / ' + (nxtXp - curXp) : s.xp + ' / ' + nxtXp;
        return '<div class="skill-card ' + cls + '">'
            + '<div class="flex items-center justify-between mb-2">'
            + '<span class="font-medium text-sm truncate">' + esc(s.name) + '</span>'
            + '<span class="text-xs font-bold font-display px-1.5 py-0.5 rounded" style="background:var(--accent-d);color:var(--accent)">Lv.' + lv + '</span>'
            + '</div>'
            + '<div class="xp-bar mb-1.5"><div class="xp-fill" style="width:' + Math.round(prog * 100) + '%"></div></div>'
            + '<div class="flex justify-between mb-3">'
            + '<span class="text-xs" style="color:var(--muted)">' + xpText + ' XP</span>'
            + '<span class="text-xs" style="color:var(--muted)">' + tc + (tc === 1 ? ' tarefa' : ' tarefas') + '</span>'
            + '</div>'
            + '<div class="flex gap-2">'
            + '<button class="btn btn-s btn-sm flex-1 text-xs" onclick="openSkillModal(\'' + s.id + '\')">'
            + '<i class="fa-solid fa-pen" style="font-size:.6rem"></i> Editar</button>'
            + '<button class="btn btn-g btn-sm flex-1 text-xs" onclick="openDelM(\'' + s.id + '\')">'
            + '<i class="fa-solid fa-trash" style="font-size:.6rem"></i> Excluir</button>'
            + '</div></div>';
    }).join('');
    S.renderSelect();
}

// ── Tasks ──────────────────────────────────────────────────────────────────────
async function addTask() {
    const inp = document.getElementById('inp-t');
    const txt = inp.value.trim();
    if (!txt) { toast('Digite uma tarefa.', 'error'); inp.focus(); return; }

    try {
        const newTask = await api.createTask(txt, activeSkill || null);
        tasks.unshift({
            id: newTask.id,
            text: newTask.text,
            skillId: newTask.skill_id || null,
            done: newTask.done,
            doneAt: newTask.done_at || null
        });
        inp.value = '';
        renderTasks();
        toast('Tarefa adicionada.', 'success');
    } catch (e) {
        toast('Erro ao adicionar tarefa.', 'error');
    }
}

async function togTask(id) {
    const t = tasks.find(x => x.id == id);
    if (!t) return;

    const newDone = !t.done;
    const newDoneAt = newDone ? new Date().toISOString() : null;

    // optimistic update
    t.done = newDone;
    t.doneAt = newDoneAt;
    renderTasks();

    try {
        await api.updateTask(id, { done: newDone, done_at: newDoneAt });
    } catch (e) {
        // revert on failure
        t.done = !newDone;
        t.doneAt = newDone ? null : newDoneAt;
        renderTasks();
        toast('Erro ao atualizar tarefa.', 'error');
    }
}

async function delTask(id) {
    try {
        await api.deleteTask(id);
        tasks = tasks.filter(x => x.id != id);
        renderTasks();
    } catch (e) {
        toast('Erro ao excluir tarefa.', 'error');
    }
}

async function clearDone() {
    const doneTasks = tasks.filter(x => x.done);
    if (!doneTasks.length) return;

    try {
        await Promise.all(doneTasks.map(t => api.deleteTask(t.id)));
        tasks = tasks.filter(x => !x.done);
        renderTasks();
        toast(doneTasks.length + ' tarefa(s) removida(s).', 'info');
    } catch (e) {
        toast('Erro ao limpar tarefas.', 'error');
    }
}

function renderTasks() {
    const list = document.getElementById('t-list');
    const empty = document.getElementById('t-empty');
    const clr = document.getElementById('btn-clr');
    const cnt = document.getElementById('t-cnt');

    const dn = tasks.filter(x => x.done).length;
    cnt.textContent = (tasks.length - dn) + '/' + tasks.length;
    clr.style.display = dn > 0 ? 'inline-flex' : 'none';

    if (tasks.length === 0) { list.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';

    const sorted = tasks.slice().sort((a, b) => a.done === b.done ? 0 : a.done ? 1 : -1);
    list.innerHTML = sorted.map(t => {
        const skTag = t.skillId ? (() => {
            const s = skills.find(x => x.id === t.skillId);
            return s ? '<span class="skill-tag">' + esc(s.name) + '</span>' : '';
        })() : '';
        const ds = t.doneAt
            ? '<span class="text-xs flex-shrink-0" style="color:var(--muted)">'
              + new Date(t.doneAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
              + '</span>'
            : '';
        return '<div class="task-item' + (t.done ? ' done' : '') + '">'
            + '<div class="task-cb' + (t.done ? ' on' : '') + '" onclick="togTask(\'' + t.id + '\')" role="checkbox" aria-checked="' + t.done + '" tabindex="0">'
            + (t.done ? '<i class="fa-solid fa-check"></i>' : '') + '</div>'
            + '<span class="task-text flex-1 text-sm leading-snug">' + esc(t.text) + '</span>'
            + skTag + ds
            + '<button class="task-del btn btn-g" onclick="delTask(\'' + t.id + '\')" aria-label="Deletar">'
            + '<i class="fa-solid fa-xmark" style="font-size:.7rem"></i></button>'
            + '</div>';
    }).join('');
}

// ── Stats ──────────────────────────────────────────────────────────────────────
function renderStats() {
    const days = l7();
    const chart = document.getElementById('st-chart');
    const totEl = document.getElementById('wk-total');

    const vals = days.map(d => daily[d.key] || 0);
    const maxV = Math.max(...vals, 1);
    const sum = vals.reduce((a, b) => a + b, 0);
    totEl.textContent = fd(sum);

    if (sum === 0) {
        chart.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="text-sm" style="color:var(--muted)">Nenhum foco registrado esta semana</span></div>';
        return;
    }

    chart.innerHTML = days.map((d, i) => {
        const v = vals[i];
        const hp = Math.max((v / maxV) * 100, v > 0 ? 5 : 1.5);
        const bg = d.today ? 'var(--accent)' : 'rgba(0,230,138,.35)';
        const ls = d.today ? 'color:var(--accent);font-weight:600' : 'color:var(--muted)';
        return '<div class="flex flex-col items-center gap-2 flex-1 min-w-0">'
            + '<div class="sbar w-full" style="height:' + hp + '%;background:' + bg + '">'
            + '<div class="sbar-tip">' + fd(v) + '</div></div>'
            + '<span class="text-xs truncate w-full text-center" style="' + ls + '">' + d.label + '</span>'
            + '</div>';
    }).join('');
}

function resetSt() {
    if (!Object.keys(daily).length) { toast('Nada para limpar.', 'info'); return; }
    daily = {};
    renderStats();
    toast('Estatísticas resetadas.', 'info');
}

// ── Events & Init ──────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('task-cb')) {
        e.preventDefault();
        e.target.click();
    }
});

(function () {
    const pg = document.getElementById('timer-prog');
    pg.style.strokeDasharray = CIRC;
    pg.style.strokeDashoffset = CIRC;
    checkSess();
})();
