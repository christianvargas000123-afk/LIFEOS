/**
 * LifeOS · tu app privada con Google Calendar.
 *
 * Instalación (una sola vez):
 * 1. Pega este código en tu proyecto de https://script.google.com y guarda.
 * 2. Implementar → Nueva implementación → engrane → Aplicación web.
 *    Ejecutar como: Yo.   Quién tiene acceso: Solo yo.
 * 3. Autoriza con tu cuenta y abre la URL que termina en /exec: esa es tu LifeOS.
 *
 * Privacidad: con "Solo yo", Google exige tu sesión para abrir la app o llamar
 * a este script. Nadie más puede entrar. El script solo usa tu Google Calendar,
 * su propio almacenamiento privado y descarga el diseño de la app desde GitHub.
 */
var ZONA = 'America/Mexico_City';
var APP_URL = 'https://christianvargas000123-afk.github.io/LIFEOS/';

/* Abre la app. El diseño se descarga de tu página de GitHub, así recibes mejoras sin tocar este script. */
function doGet(e) {
  var fresh = !!(e && e.parameter && e.parameter.v); // ?v=1 fuerza descargar la versión más reciente
  return HtmlService.createHtmlOutput(appHtml(fresh))
    .setTitle('LifeOS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setFaviconUrl(APP_URL + 'icon-192.png');
}

function appHtml(fresh) {
  var cache = CacheService.getScriptCache();
  var meta = cache.get('app_n');
  if (meta && !fresh) {
    var parts = [];
    for (var i = 0; i < +meta; i++) parts.push(cache.get('app_' + i) || '');
    var cached = parts.join('');
    if (cached.length) return cached;
  }
  var html = UrlFetchApp.fetch(APP_URL + 'index.html?v=' + Date.now(), { muteHttpExceptions: true }).getContentText();
  var size = 90000, n = Math.ceil(html.length / size), put = { app_n: String(n) };
  for (var j = 0; j < n; j++) put['app_' + j] = html.slice(j * size, (j + 1) * size);
  try { cache.putAll(put, 300); } catch (e) {}
  return html;
}

/* La app llama aquí con google.script.run. Solo funciona para quien puede abrir la app: tú. */
function handle(req) {
  var fn = ACTIONS[req && req.action];
  if (!fn) return { ok: false, code: 'bad_request', error: 'Acción desconocida' };
  var res = fn(req) || {};
  res.ok = true;
  return res;
}

var ACTIONS = {
  ping: function () { return { tz: ZONA, calendar: CalendarApp.getDefaultCalendar().getName() }; },
  load: function () { return readData(); },
  save: function (r) { return writeData(r); },
  events: function (r) { return { events: listEvents(r.from, r.to) }; },
  createEvent: function (r) { return createEv(r); },
  updateEvent: function (r) { return updateEv(r); },
  deleteEvent: function (r) { return deleteEv(r); }
};

/* ---------- almacenamiento: tus datos en trozos dentro de las propiedades privadas del script ---------- */
function store() { return PropertiesService.getUserProperties(); }
function meta(p) { return JSON.parse(p.getProperty('meta') || '{"n":0,"ts":0}'); }

function readData() {
  var p = store(), m = meta(p), s = '';
  for (var i = 0; i < m.n; i++) s += p.getProperty('d' + i) || '';
  return { data: s || null, ts: m.ts || 0 };
}

function writeData(r) {
  var lock = LockService.getUserLock();
  lock.waitLock(15000);
  try {
    var p = store(), m = meta(p);
    if (m.ts && m.ts > (r.base || 0) && m.ts !== r.ts) {
      var cur = readData();
      return { conflict: true, data: cur.data, ts: cur.ts };
    }
    var s = String(r.data || ''), size = 8000, n = Math.ceil(s.length / size), props = {};
    if (s.length > 450000) throw new Error('Los datos superan el límite de almacenamiento');
    for (var i = 0; i < n; i++) props['d' + i] = s.slice(i * size, (i + 1) * size);
    props.meta = JSON.stringify({ n: n, ts: r.ts });
    p.setProperties(props, false);
    for (var j = n; j < m.n; j++) p.deleteProperty('d' + j);
    return { ts: r.ts };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- calendario ---------- */
function cal() { return CalendarApp.getDefaultCalendar(); }
function day(s, hm) { return Utilities.parseDate(s + ' ' + (hm || '12:00'), ZONA, 'yyyy-MM-dd HH:mm'); }

function listEvents(from, to) {
  var a = day(from, '00:00'), b = day(to, '23:59');
  return cal().getEvents(a, b).slice(0, 500).map(function (ev) {
    var all = ev.isAllDayEvent(), st = all ? ev.getAllDayStartDate() : ev.getStartTime();
    return {
      id: ev.getId(),
      title: ev.getTitle() || '(Sin título)',
      date: Utilities.formatDate(st, ZONA, 'yyyy-MM-dd'),
      time: all ? null : Utilities.formatDate(st, ZONA, 'HH:mm')
    };
  });
}

function times(r) {
  if (r.hora) {
    var st = day(r.date, r.hora);
    return { allDay: false, st: st, en: new Date(st.getTime() + Math.max(15, r.durMin || 30) * 60000) };
  }
  return { allDay: true, d: day(r.date, '12:00') };
}

function setReminders(ev, r) {
  ev.removeAllReminders();
  if (r.done) return;
  ev.addPopupReminder(r.hora ? Math.max(0, r.remindMin || 0) : 180); // sin hora: 21:00 de la noche anterior
}

function createEv(r) {
  var t = times(r), opt = { description: r.desc || '' }, ev;
  if (r.rec) {
    var rule = CalendarApp.newRecurrence();
    if (r.rec === 'daily') rule.addDailyRule(); else if (r.rec === 'weekly') rule.addWeeklyRule(); else rule.addMonthlyRule();
    ev = t.allDay ? cal().createAllDayEventSeries(r.title, t.d, rule, opt) : cal().createEventSeries(r.title, t.st, t.en, rule, opt);
  } else {
    ev = t.allDay ? cal().createAllDayEvent(r.title, t.d, opt) : cal().createEvent(r.title, t.st, t.en, opt);
  }
  setReminders(ev, r);
  return { id: ev.getId() };
}

function updateEv(r) {
  var ev = cal().getEventById(r.id);
  if (!ev) return { missing: true };
  if (r.title) ev.setTitle(r.title);
  if (r.date) {
    var t = times(r);
    if (t.allDay) ev.setAllDayDate(t.d); else ev.setTime(t.st, t.en);
  }
  setReminders(ev, r);
  return {};
}

function deleteEv(r) {
  if (r.series) {
    var s = cal().getEventSeriesById(r.id);
    if (s) s.deleteEventSeries();
    return {};
  }
  var ev = cal().getEventById(r.id);
  if (ev) ev.deleteEvent();
  return {};
}
