// ===== Sky Journal — app logic =====

const SIGN_GLYPHS = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓'
};
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MOOD_EMOJIS = ["😞","😕","😐","🙂","😄"];
const MOOD_LABELS = ["Rough","Off","Okay","Good","Great"];

let todayISO = null; // set on load
let selectedDayISO = null; // for year view click-through
let dailyByDate = {}; // date -> daily entry
let moodLog = {}; // date -> {score, note}

const MOOD_KEY = "skyjournal_mood_log";

function loadMoodLog() {
  try {
    const raw = localStorage.getItem(MOOD_KEY);
    moodLog = raw ? JSON.parse(raw) : {};
  } catch(e) { moodLog = {}; }
}
function saveMoodLog() {
  try { localStorage.setItem(MOOD_KEY, JSON.stringify(moodLog)); } catch(e) {}
}

function init() {
  loadMoodLog();
  ASTRO_DATA.daily.forEach(d => dailyByDate[d.date] = d);

  const now = new Date();
  todayISO = formatISO(now);
  // If today is outside our generated window, clamp to nearest available date
  if (!dailyByDate[todayISO]) {
    const dates = Object.keys(dailyByDate).sort();
    if (todayISO < dates[0]) todayISO = dates[0];
    else todayISO = dates[dates.length - 1];
  }
  selectedDayISO = todayISO;

  document.getElementById('headerDate').textContent = formatLongDate(parseISO(todayISO));

  renderStars();
  renderToday();
  renderYear();
  renderMoodHistory();
  bindNav();
  bindModal();
}

function formatISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function parseISO(iso) {
  const [y,m,d] = iso.split('-').map(Number);
  return new Date(y, m-1, d);
}
function formatLongDate(d) {
  return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
}
function formatShortDate(d) {
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

// ---------- Stars ambient background ----------
function renderStars() {
  const layer = document.getElementById('starsLayer');
  const starSVG = (size) => `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"/></svg>`;
  const count = 14;
  let html = '';
  for (let i=0; i<count; i++) {
    const top = Math.random()*100;
    const left = Math.random()*100;
    const size = 6 + Math.random()*10;
    const delay = Math.random()*5;
    const gold = i % 4 === 0 ? 'gold' : '';
    html += `<div class="star ${gold}" style="top:${top}%; left:${left}%; width:${size}px; height:${size}px; animation-delay:${delay}s;">${starSVG(size)}</div>`;
  }
  layer.innerHTML = html;
}

// ---------- Nav ----------
function bindNav() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('view-today').classList.toggle('active', tab === 'today');
  document.getElementById('view-year').classList.toggle('active', tab === 'year');
  document.getElementById('view-mood').classList.toggle('active', tab === 'mood');
}

// ---------- Modal ----------
function bindModal() {
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modalBackdrop') closeModal();
  });
}
function openModal(title, bodyHTML) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalBackdrop').classList.add('open');
}
function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
}
function showGlossary(category, key) {
  const entry = GLOSSARY[category] && GLOSSARY[category][key];
  if (!entry) return;
  openModal(entry.name, `<p>${entry.text}</p>`);
}
window.showGlossary = showGlossary;

function helpBtn(category, key) {
  return `<button class="help-btn" onclick="showGlossary('${category}','${key}')" aria-label="What does this mean?">?</button>`;
}

// ================= TODAY VIEW =================
function renderToday() {
  const data = dailyByDate[todayISO];
  if (!data) {
    document.getElementById('view-today').innerHTML = `<div class="empty-state">No data for today.</div>`;
    return;
  }

  const pm = data.progressed_moon;
  const tm = data.transiting_moon;
  const vocToday = findVocForDate(todayISO);
  const major = data.major_transits || [];
  const full = data.full_transits || [];
  const ns = ASTRO_DATA.natal_summary;

  let html = '';

  // My Chart card (Rising + MC quick reference)
  html += `
  <div class="card">
    <div class="card-header">
      <div class="card-title">My Chart</div>
    </div>
    <div class="pill-row">
      <span class="pill">${SIGN_GLYPHS[ns.Ascendant.sign]} Rising: ${ns.Ascendant.sign} ${helpBtn('concepts','Ascendant')}</span>
      <span class="pill">${SIGN_GLYPHS[ns.Sun.sign]} Sun: ${ns.Sun.sign} (H${ns.Sun.house})</span>
      <span class="pill">${SIGN_GLYPHS[ns.Moon.sign]} Moon: ${ns.Moon.sign} (H${ns.Moon.house})</span>
      <span class="pill">${SIGN_GLYPHS[ns.Midheaven.sign]} MC: ${ns.Midheaven.sign} ${helpBtn('concepts','Midheaven')}</span>
    </div>
    <button class="link-btn" onclick="showFullNatalChart()">See full natal chart →</button>
  </div>`;

  // Progressed Moon card
  html += `
  <div class="card">
    <div class="card-header">
      <div class="card-title">Progressed Moon ${helpBtn('concepts','progressed_moon')}</div>
    </div>
    <div class="big-stat">${SIGN_GLYPHS[pm.sign]} ${pm.sign} <span style="font-size:16px; opacity:0.6; font-family:Inter, sans-serif; font-weight:600;">${pm.degree.toFixed(1)}°</span></div>
    <div class="sub-stat">House ${pm.house} ${helpBtn('houses', pm.house)} &nbsp;·&nbsp; ${pm.phase} phase ${helpBtn('phases', pm.phase)}</div>
    <div class="blurb">${progressedMoonBlurb(pm)} ${progressedMoonInsight(pm)}</div>
  </div>`;

  // Transiting Moon card
  html += `
  <div class="card">
    <div class="card-header">
      <div class="card-title">Moon Today ${helpBtn('concepts','transiting_moon')}</div>
    </div>
    <div class="big-stat">${SIGN_GLYPHS[tm.sign]} ${tm.sign} <span style="font-size:16px; opacity:0.6; font-family:Inter, sans-serif; font-weight:600;">${tm.degree.toFixed(1)}°</span></div>
    <div class="sub-stat">House ${tm.house} ${helpBtn('houses', tm.house)} &nbsp;·&nbsp; ${tm.phase} phase ${helpBtn('phases', tm.phase)}</div>
    ${vocToday ? `<div class="pill-row" style="margin-top:8px;"><span class="pill deep">Void of Course ${vocToday.untilText} ${helpBtn('concepts','voc')}</span></div>` : ''}
    <div class="blurb">Emotionally, ${transitMoonInsight(tm)}.</div>
  </div>`;

  // Transits card — now with real interpretation text, not just labels
  html += `
  <div class="card">
    <div class="card-header">
      <div class="card-title">What's Active Today ${helpBtn('concepts','transit')}</div>
    </div>`;
  if (major.length === 0) {
    html += `<p class="empty-note">No major transits today — a quieter sky.</p>`;
  } else {
    major.slice(0, 6).forEach(t => {
      html += transitRowDetailed(t);
    });
  }
  if (full.length > 0) {
    html += `<button class="link-btn" onclick="showFullTransits('${todayISO}')">See all ${full.length} transits →</button>`;
  }
  html += `</div>`;

  // Mood card
  html += renderMoodCard(todayISO);

  document.getElementById('view-today').innerHTML = html;
  bindMoodCard(todayISO);
}

function transitRowDetailed(t) {
  return `<div style="padding:11px 0; border-bottom:1px solid var(--line);">
    <div class="transit-item" style="padding:0; border-bottom:none;">
      <span class="planets">${t.transiting} ${helpBtn('planets', t.transiting)} ${t.aspect.toLowerCase()} natal ${t.natal} ${t.natal !== 'Ascendant' && t.natal !== 'Midheaven' ? helpBtn('planets', t.natal) : helpBtn('concepts', t.natal)}</span>
      <span class="aspect-tag">${t.aspect}</span>
      ${t.retrograde ? `<span class="retro-mark" title="Retrograde">℞</span>` : ''}
    </div>
    <div style="font-size:12.5px; color:var(--plum-text); opacity:0.8; margin-top:5px; line-height:1.5;">${interpretTransit(t)}</div>
  </div>`;
}

function transitRow(t) {
  return `<div class="transit-item">
    <span class="planets">${t.transiting} ${helpBtn('planets', t.transiting)} ${t.aspect.toLowerCase()} natal ${t.natal} ${t.natal !== 'Ascendant' && t.natal !== 'Midheaven' ? helpBtn('planets', t.natal) : helpBtn('concepts', t.natal)}</span>
    <span class="aspect-tag">${t.aspect}</span>
    ${t.retrograde ? `<span class="retro-mark" title="Retrograde">℞</span>` : ''}
  </div>`;
}

function showFullTransits(iso) {
  const data = dailyByDate[iso];
  if (!data) return;
  let html = '<div>';
  data.full_transits.forEach(t => { html += transitRowDetailed(t); });
  html += '</div>';
  openModal('All transits — ' + formatShortDate(parseISO(iso)), html);
}
window.showFullTransits = showFullTransits;

function showFullNatalChart() {
  const ns = ASTRO_DATA.natal_summary;
  const order = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  let html = `<p style="margin-bottom:10px;"><strong>Ascendant:</strong> ${ns.Ascendant.sign} ${ns.Ascendant.degree.toFixed(1)}°</p>`;
  order.forEach(p => {
    const e = ns[p];
    html += `<div class="transit-item"><span class="planets">${SIGN_GLYPHS[e.sign]} ${p} — ${e.sign} ${e.degree.toFixed(1)}°</span><span class="aspect-tag">House ${e.house}</span></div>`;
  });
  html += `<p style="margin-top:10px;"><strong>Midheaven:</strong> ${ns.Midheaven.sign} ${ns.Midheaven.degree.toFixed(1)}°</p>`;
  html += `<p class="empty-note" style="margin-top:10px;">Born July 4, 2003, 3:20 AM — Suceava, Romania</p>`;
  openModal('Your Natal Chart', html);
}
window.showFullNatalChart = showFullNatalChart;

function progressedMoonBlurb(pm) {
  const enteredNote = pm.sign === 'Cancer' ? ' It entered Cancer in late December 2025 and stays through roughly May 2028.' : '';
  return `Your progressed Moon has been in ${pm.sign} for a while now.${enteredNote}`;
}

function findVocForDate(iso) {
  const target = parseISO(iso);
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0,0,0);
  const targetEnd = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23,59,59);
  for (const v of ASTRO_DATA.voc_periods) {
    const vs = new Date(v.start);
    const ve = new Date(v.end);
    if (vs <= targetEnd && ve >= targetStart) {
      const endStr = ve.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'});
      const endDateStr = formatShortDate(ve);
      const sameDay = formatISO(ve) === iso;
      return { ...v, untilText: sameDay ? `until ${endStr}` : `until ${endDateStr}` };
    }
  }
  return null;
}

// ---------- Mood card (shared between today + year detail) ----------
function renderMoodCard(iso) {
  const existing = moodLog[iso];
  let buttons = '';
  MOOD_EMOJIS.forEach((emoji, i) => {
    const sel = existing && existing.score === i ? 'selected' : '';
    buttons += `<button class="mood-btn ${sel}" data-mood="${i}" aria-label="${MOOD_LABELS[i]}" title="${MOOD_LABELS[i]}">${emoji}</button>`;
  });
  return `
  <div class="card" id="moodCard-${iso}">
    <div class="card-header"><div class="card-title">How are you feeling?</div></div>
    <div class="mood-scale" data-iso="${iso}">${buttons}</div>
    <textarea class="mood-note-input" rows="2" placeholder="Anything you want to remember about today... (optional)">${existing && existing.note ? existing.note : ''}</textarea>
    <button class="save-mood-btn" data-iso="${iso}">Save</button>
    <div class="saved-confirm" id="savedConfirm-${iso}">Saved ✓</div>
  </div>`;
}

function bindMoodCard(iso) {
  const scale = document.querySelector(`.mood-scale[data-iso="${iso}"]`);
  if (!scale) return;
  let selectedScore = moodLog[iso] ? moodLog[iso].score : null;
  scale.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedScore = parseInt(btn.dataset.mood, 10);
      scale.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  const saveBtn = document.querySelector(`.save-mood-btn[data-iso="${iso}"]`);
  saveBtn.addEventListener('click', () => {
    const noteEl = saveBtn.parentElement.querySelector('.mood-note-input');
    if (selectedScore === null) {
      noteEl.placeholder = "Pick a mood above first \u2014 then save.";
      return;
    }
    moodLog[iso] = { score: selectedScore, note: noteEl.value.trim() };
    saveMoodLog();
    const confirm = document.getElementById('savedConfirm-' + iso);
    confirm.style.display = 'block';
    setTimeout(() => { confirm.style.display = 'none'; }, 2000);
    renderMoodHistory();
  });
}

// ================= YEAR VIEW =================
function renderYear() {
  let html = `
  <div class="year-toggle">
    <button class="active" data-yview="calendar">Calendar</button>
    <button data-yview="timeline">Timeline</button>
  </div>
  <div class="legend-row">
    <span><span class="dot" style="background:var(--rose)"></span> Major transit</span>
    <span><span class="dot" style="background:var(--gold)"></span> Void of course</span>
    <span><span class="dot" style="background:var(--plum-deep)"></span> Progressed Moon shift</span>
  </div>
  <div id="yearCalendarWrap"></div>
  <div id="yearTimelineWrap" style="display:none;"></div>
  `;
  document.getElementById('view-year').innerHTML = html;

  renderYearCalendar();
  renderYearTimeline();

  document.querySelectorAll('[data-yview]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-yview]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isCal = btn.dataset.yview === 'calendar';
      document.getElementById('yearCalendarWrap').style.display = isCal ? 'block' : 'none';
      document.getElementById('yearTimelineWrap').style.display = isCal ? 'none' : 'block';
    });
  });
}

function renderYearCalendar() {
  const dates = Object.keys(dailyByDate).sort();
  const startDate = parseISO(dates[0]);
  const endDate = parseISO(dates[dates.length-1]);

  // group by calendar month
  const months = [];
  let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= lastMonth) {
    months.push(new Date(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth()+1, 1);
  }

  let html = '';
  months.forEach(monthStart => {
    const y = monthStart.getFullYear();
    const m = monthStart.getMonth();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const firstWeekday = new Date(y, m, 1).getDay(); // 0=Sun

    html += `<div class="month-block">
      <div class="month-label">${MONTH_NAMES[m]} ${y}</div>
      <div class="cal-grid">`;

    for (let i=0; i<firstWeekday; i++) html += `<div class="cal-day blank"></div>`;

    for (let day=1; day<=daysInMonth; day++) {
      const iso = y + '-' + String(m+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
      if (!dailyByDate[iso]) { continue; }
      const data = dailyByDate[iso];
      const isToday = iso === todayISO;
      const hasTransit = (data.major_transits || []).length > 0;
      const hasVoc = !!findVocForDate(iso);
      const progShift = ASTRO_DATA.progressed_moon_timeline.some(p => p.date === iso);

      let dots = '';
      if (hasTransit) dots += '<span class="m-transit"></span>';
      if (hasVoc) dots += '<span class="m-voc"></span>';
      if (progShift) dots += '<span class="m-prog"></span>';

      html += `<div class="cal-day ${isToday ? 'today' : ''}" onclick="openDayDetail('${iso}')">
        ${day}
        <div class="dot-marks">${dots}</div>
      </div>`;
    }
    html += `</div></div>`;
  });

  document.getElementById('yearCalendarWrap').innerHTML = html;
}

function renderYearTimeline() {
  // Merge progressed moon shifts + retrograde events into one chronological timeline
  const events = [];
  const windowStart = ASTRO_DATA.meta.window_start;
  ASTRO_DATA.progressed_moon_timeline.forEach(e => {
    if (e.date === windowStart) return; // artifact of window start, not a real transition happening now
    events.push({ date: e.date, html: `<strong>Progressed Moon enters ${e.sign}</strong> — a new multi-year emotional chapter begins.` });
  });
  ASTRO_DATA.retrograde_events.forEach(e => {
    const verb = e.event === 'retrograde_start' ? 'turns retrograde' : 'goes direct';
    events.push({ date: e.date, html: `<strong>${e.planet} ${verb}</strong> ${e.event === 'retrograde_start' ? '— time to review rather than launch.' : '— forward motion resumes.'}` });
  });
  events.sort((a,b) => a.date.localeCompare(b.date));

  let html = '';
  if (events.length === 0) {
    html = `<div class="empty-state">No major shifts found in this window.</div>`;
  } else {
    events.forEach(e => {
      html += `<div class="timeline-item">
        <div class="timeline-date">${formatShortDate(parseISO(e.date))}</div>
        <div class="timeline-text">${e.html}</div>
      </div>`;
    });
  }
  document.getElementById('yearTimelineWrap').innerHTML = html;
}

function openDayDetail(iso) {
  const data = dailyByDate[iso];
  if (!data) return;
  const pm = data.progressed_moon, tm = data.transiting_moon;
  const voc = findVocForDate(iso);
  let body = `
    <p><strong>Progressed Moon:</strong> ${pm.sign} ${pm.degree.toFixed(1)}°, House ${pm.house}, ${pm.phase} phase</p>
    <p><strong>Moon today:</strong> ${tm.sign} ${tm.degree.toFixed(1)}°, House ${tm.house}, ${tm.phase} phase</p>
    ${voc ? `<p><strong>Void of Course</strong> ${voc.untilText}</p>` : ''}
    <p style="margin-top:10px;"><strong>Transits:</strong></p>
  `;
  if ((data.major_transits||[]).length === 0) {
    body += `<p class="empty-note">No major transits this day.</p>`;
  } else {
    data.major_transits.forEach(t => {
      body += transitRowDetailed(t);
    });
  }
  openModal(formatLongDate(parseISO(iso)), body);
}
window.openDayDetail = openDayDetail;

// ================= MOOD HISTORY VIEW =================
function renderMoodHistory() {
  const entries = Object.keys(moodLog).sort().reverse();
  let html = '';

  if (entries.length === 0) {
    html = `<div class="empty-state">No mood logs yet. Head to Today and log how you're feeling \u2014 patterns will show up here over time.</div>`;
  } else {
    // Correlation insight card (simple: average mood by progressed moon phase, and by VoC vs not)
    html += renderMoodInsights(entries);

    html += `<div class="card"><div class="card-header"><div class="card-title">Your Log</div></div>`;
    entries.forEach(iso => {
      const entry = moodLog[iso];
      const data = dailyByDate[iso];
      html += `<div class="transit-item" style="align-items:flex-start;">
        <span style="font-size:20px;">${MOOD_EMOJIS[entry.score]}</span>
        <div style="flex:1;">
          <div style="font-weight:600; color:var(--plum-deep); font-size:13px;">${formatShortDate(parseISO(iso))} · ${MOOD_LABELS[entry.score]}</div>
          ${data ? `<div style="font-size:11.5px; opacity:0.65; margin-top:2px;">Moon in ${data.transiting_moon.sign} · Progressed Moon in ${data.progressed_moon.sign}</div>` : ''}
          ${entry.note ? `<div style="font-size:12.5px; margin-top:4px;">${escapeHTML(entry.note)}</div>` : ''}
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  document.getElementById('view-mood').innerHTML = html;
}

function renderMoodInsights(entries) {
  if (entries.length < 3) {
    return `<div class="card"><p class="empty-note">Log a few more days and patterns between your mood and the sky will start to show up here.</p></div>`;
  }
  // average mood during VoC days vs non-VoC days
  let vocSum=0, vocCount=0, nonVocSum=0, nonVocCount=0;
  const phaseSums = {};
  entries.forEach(iso => {
    const score = moodLog[iso].score;
    const isVoc = !!findVocForDate(iso);
    if (isVoc) { vocSum += score; vocCount++; } else { nonVocSum += score; nonVocCount++; }
    const data = dailyByDate[iso];
    if (data) {
      const phase = data.transiting_moon.phase;
      if (!phaseSums[phase]) phaseSums[phase] = {sum:0, count:0};
      phaseSums[phase].sum += score;
      phaseSums[phase].count++;
    }
  });

  let insightLines = [];
  if (vocCount > 0 && nonVocCount > 0) {
    const vocAvg = vocSum/vocCount, nonVocAvg = nonVocSum/nonVocCount;
    const diff = vocAvg - nonVocAvg;
    if (Math.abs(diff) > 0.4) {
      insightLines.push(`Your mood runs ${diff < 0 ? 'lower' : 'higher'} on Void of Course days (avg ${vocAvg.toFixed(1)} vs ${nonVocAvg.toFixed(1)}/4).`);
    }
  }
  let bestPhase = null, worstPhase = null;
  Object.entries(phaseSums).forEach(([phase, s]) => {
    if (s.count < 2) return;
    const avg = s.sum/s.count;
    if (!bestPhase || avg > bestPhase.avg) bestPhase = {phase, avg};
    if (!worstPhase || avg < worstPhase.avg) worstPhase = {phase, avg};
  });
  if (bestPhase && worstPhase && bestPhase.phase !== worstPhase.phase) {
    insightLines.push(`Logged mood tends to be highest during ${bestPhase.phase} Moon days, lowest during ${worstPhase.phase}.`);
  }

  if (insightLines.length === 0) {
    return `<div class="card"><p class="empty-note">Not enough variation yet to spot a pattern \u2014 keep logging.</p></div>`;
  }

  return `<div class="card">
    <div class="card-header"><div class="card-title">Patterns So Far</div></div>
    ${insightLines.map(l => `<p class="blurb" style="border-top:none; padding-top:0; margin-top:6px;">${l}</p>`).join('')}
    <p class="empty-note" style="margin-top:8px;">This is a correlation from your own logged data, not a guaranteed cause \u2014 think of it as a pattern worth noticing.</p>
  </div>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', init);
