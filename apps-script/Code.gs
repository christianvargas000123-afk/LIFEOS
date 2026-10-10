/**
 * LifeOS · puente con Google Calendar y almacenamiento de tus datos.
 *
 * Cómo instalarlo (también aparece dentro de LifeOS → Ajustes):
 * 1. En LifeOS toca "Copiar código del script". Ese código ya trae tu clave personal.
 * 2. Abre https://script.google.com, crea un proyecto nuevo y pega el código.
 * 3. Implementar → Nueva implementación → Aplicación web.
 *    Ejecutar como: Yo. Quién tiene acceso: Cualquier usuario.
 * 4. Autoriza con tu cuenta y pega la URL de la aplicación web en LifeOS.
 *
 * Este script solo usa tu Google Calendar y su propio almacenamiento privado.
 * Sin la clave correcta no responde nada.
 */
var CLAVE = '__CLAVE__';
var ZONA = 'America/Mexico_City';

function doPost(e) {
  var req = {};
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return out({ ok: false, code: 'bad_request', error: 'Solicitud inválida' }); }
  if (!req.key || req.key !== CLAVE) return out({ ok: false, code: 'unauthorized', error: 'La clave no coincide' });
  var fn = ACTIONS[req.action];
  if (!fn) return out({ ok: false, code: 'bad_request', error: 'Acción desconocida' });
  try {
    var res = fn(req) || {};
    res.ok = true;
    return out(res);
  } catch (err) {
    return out({ ok: false, code: 'server', error: String((err && err.message) || err) });
  }
}

function doGet() { return out({ ok: true, app: 'LifeOS' }); }

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
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
