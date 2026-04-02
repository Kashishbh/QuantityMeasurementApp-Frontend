const API_BASE = 'http://localhost:3000';

const MEASUREMENTS = {
  length: {
    label: 'LENGTH',
    units: [
      { id: 'in', label: 'Inch', factor: 39.37007874015748 },
      { id: 'ft', label: 'Feet', factor: 3.280839895013123 },
      { id: 'yd', label: 'Yard', factor: 1.093613298337778 },
      { id: 'm', label: 'Meter', factor: 1 },
    ],
    convert: (value, fromId, toId) => {
      const from = MEASUREMENTS.length.units.find((u) => u.id === fromId);
      const to = MEASUREMENTS.length.units.find((u) => u.id === toId);
      if (!from || !to) return null;
      const inMeters = value / from.factor;
      return inMeters * to.factor;
    },
  },
  temperature: {
    label: 'TEMPERATURE',
    units: [
      { id: 'c', label: 'Celsius' },
      { id: 'f', label: 'Fahrenheit' },
    ],
    convert: (value, fromId, toId) => {
      if (fromId === toId) return value;
      if (fromId === 'c' && toId === 'f') return value * (9 / 5) + 32;
      if (fromId === 'f' && toId === 'c') return (value - 32) * (5 / 9);
      return null;
    },
  },
  volume: {
    label: 'VOLUME',
    units: [
      { id: 'l', label: 'Litre', factor: 1 },
      { id: 'ml', label: 'Millilitre', factor: 1000 },
      { id: 'gal', label: 'Gallon', factor: 0.2641720523581484 },
    ],
    convert: (value, fromId, toId) => {
      const from = MEASUREMENTS.volume.units.find((u) => u.id === fromId);
      const to = MEASUREMENTS.volume.units.find((u) => u.id === toId);
      if (!from || !to) return null;
      const inLiters = value / from.factor;
      return inLiters * to.factor;
    },
  },
  weight: {
    label: 'WEIGHT',
    units: [
      { id: 'kg', label: 'Kilogram', factor: 1 },
      { id: 'g', label: 'Gram', factor: 1000 },
      { id: 'lb', label: 'Pound', factor: 2.2046226218487757 },
    ],
    convert: (value, fromId, toId) => {
      const from = MEASUREMENTS.weight.units.find((u) => u.id === fromId);
      const to = MEASUREMENTS.weight.units.find((u) => u.id === toId);
      if (!from || !to) return null;
      const inKg = value / from.factor;
      return inKg * to.factor;
    },
  },
};

const el = {
  tabs: Array.from(document.querySelectorAll('.tab')),
  converter: document.getElementById('converter'),
  operation: document.getElementById('operation'),
  value1: document.getElementById('value1'),
  unit1: document.getElementById('unit1'),
  wrapValue2: document.getElementById('wrapValue2'),
  value2: document.getElementById('value2'),
  unit2: document.getElementById('unit2'),
  labelValue2: document.getElementById('labelValue2'),
  labelUnit2: document.getElementById('labelUnit2'),
  resultValue: document.getElementById('resultValue'),
  statusText: document.getElementById('statusText'),
  saveBtn: document.getElementById('saveBtn'),
  swapBtn: document.getElementById('swapBtn'),
  historyBtn: document.getElementById('historyBtn'),
  historyModal: document.getElementById('historyModal'),
  historyList: document.getElementById('historyList'),
  historyError: document.getElementById('historyError'),
  refreshHistoryBtn: document.getElementById('refreshHistoryBtn'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
};

let activeType = 'length';

function fmt(n) {
  if (!Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 3 : abs >= 1 ? 6 : 8;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function setStatus(text) {
  el.statusText.textContent = text || '';
}

function getUnits(type) {
  return MEASUREMENTS[type]?.units ?? [];
}

function fillUnitSelect(selectEl, units, selectedId) {
  selectEl.innerHTML = '';
  for (const u of units) {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.label;
    selectEl.appendChild(opt);
  }
  if (selectedId && units.some((u) => u.id === selectedId)) {
    selectEl.value = selectedId;
  } else if (units[0]) {
    selectEl.value = units[0].id;
  }
}

function defaultUnitPairFor(type) {
  if (type === 'length') return { u1: 'm', u2: 'ft' };
  if (type === 'temperature') return { u1: 'c', u2: 'f' };
  if (type === 'volume') return { u1: 'l', u2: 'ml' };
  if (type === 'weight') return { u1: 'kg', u2: 'g' };
  const u = getUnits(type);
  return { u1: u[0]?.id, u2: u[1]?.id ?? u[0]?.id };
}

function unitLabel(type, id) {
  return getUnits(type).find((u) => u.id === id)?.label ?? id;
}

function parseNumber(raw) {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/,/g, '')
    .replace(/\s+/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

function convertVal(value, fromId, toId) {
  return MEASUREMENTS[activeType]?.convert?.(value, fromId, toId);
}

function toggleOperationUI() {
  const op = el.operation.value;
  const isConvert = op === 'convert';
  el.converter.classList.toggle('converter--convert', isConvert);
  el.wrapValue2.hidden = isConvert;
  el.value2.disabled = isConvert;
  el.labelValue2.hidden = isConvert;
  el.labelUnit2.textContent = isConvert ? 'To unit' : 'Unit 2';
  runCompute();
}

function swapUnits() {
  const a = el.unit1.value;
  el.unit1.value = el.unit2.value;
  el.unit2.value = a;
  runCompute();
}

function runCompute() {
  const op = el.operation.value;
  const u1 = el.unit1.value;
  const u2 = el.unit2.value;
  const v1 = parseNumber(el.value1.value);
  const v2 = parseNumber(el.value2.value);

  if (op === 'convert') {
    if (v1 == null) {
      el.resultValue.value = '';
      setStatus('');
      return;
    }
    const out = convertVal(v1, u1, u2);
    if (out == null) {
      el.resultValue.value = '';
      setStatus('Unable to convert with selected units.');
      return;
    }
    el.resultValue.value = fmt(out);
    setStatus(`${fmt(v1)} ${unitLabel(activeType, u1)} → ${fmt(out)} ${unitLabel(activeType, u2)}`);
    return;
  }

  if (v1 == null || v2 == null) {
    el.resultValue.value = '';
    setStatus('');
    return;
  }

  const n1 = convertVal(v1, u1, u2);
  if (n1 == null) {
    el.resultValue.value = '';
    setStatus('Unable to normalize value 1 to unit 2.');
    return;
  }
  const n2 = v2;

  if (op === 'compare') {
    const eps = 1e-9 * Math.max(1, Math.abs(n1), Math.abs(n2));
    let msg = '';
    if (Math.abs(n1 - n2) <= eps) msg = 'Values are equal (in unit 2).';
    else if (n1 > n2) msg = 'First value is greater than second value (in unit 2).';
    else msg = 'Second value is greater than first value (in unit 2).';
    el.resultValue.value = '';
    setStatus(msg);
    return;
  }

  let out = null;
  if (op === 'add') out = n1 + n2;
  if (op === 'subtract') out = n1 - n2;
  if (op === 'divide') out = n2 === 0 ? null : n1 / n2;

  if (out == null || !Number.isFinite(out)) {
    el.resultValue.value = '';
    setStatus(op === 'divide' && n2 === 0 ? 'Cannot divide by zero.' : 'Invalid calculation.');
    return;
  }

  el.resultValue.value = fmt(out);
  const sym = op === 'add' ? '+' : op === 'subtract' ? '−' : '÷';
  const u2l = unitLabel(activeType, u2);
  setStatus(`${fmt(n1)} ${u2l} ${sym} ${fmt(n2)} ${u2l} = ${fmt(out)} ${u2l}`);
}

function setActiveType(type) {
  activeType = type;
  for (const tab of el.tabs) {
    const isActive = tab.dataset.type === type;
    tab.classList.toggle('isActive', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  }
  const units = getUnits(type);
  const d = defaultUnitPairFor(type);
  fillUnitSelect(el.unit1, units, d.u1);
  fillUnitSelect(el.unit2, units, d.u2);
  setStatus(`${MEASUREMENTS[type].label} selected`);
  runCompute();
}

function historyItemView(item) {
  const wrap = document.createElement('div');
  wrap.className = 'historyItem';
  const left = document.createElement('div');
  left.className = 'historyLeft';
  const main = document.createElement('div');
  main.className = 'historyMain';
  const op = item.operation ? String(item.operation) : 'CONVERT';
  const v2part = item.value2 ? ` vs ${item.value2} ${item.value2UnitLabel ?? ''}` : '';
  main.textContent = `${op}: ${item.fromValue ?? ''} ${item.fromUnitLabel ?? ''}${v2part} → ${item.toValue ?? ''}${
    item.toUnitLabel ? ` ${item.toUnitLabel}` : ''
  }`;
  const sub = document.createElement('div');
  sub.className = 'historySub';
  const when = item.createdAt ? new Date(item.createdAt) : null;
  sub.textContent = `${item.measurementLabel ?? ''} • ${when ? when.toLocaleString() : ''}`.trim();
  left.appendChild(main);
  left.appendChild(sub);
  const pill = document.createElement('div');
  pill.className = 'pill';
  pill.textContent = item.measurementLabel ?? '';
  wrap.appendChild(left);
  wrap.appendChild(pill);
  return wrap;
}

async function fetchHistory() {
  showHistoryError('');
  el.historyList.innerHTML = '';
  try {
    const res = await fetch(`${API_BASE}/history?_sort=createdAt&_order=desc`);
    if (!res.ok) throw new Error(`History fetch failed (${res.status})`);
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'historySub';
      empty.textContent = 'No history yet. Save a conversion to see it here.';
      el.historyList.appendChild(empty);
      return;
    }
    for (const item of items) el.historyList.appendChild(historyItemView(item));
  } catch (e) {
    showHistoryError(
      `Could not load history. Start JSON Server at ${API_BASE} and ensure /history exists. (${e?.message ?? e})`
    );
  }
}

function buildHistoryPayload() {
  const op = el.operation.value;
  const opUpper = op.toUpperCase();
  const u1 = el.unit1.value;
  const u2 = el.unit2.value;
  const v1 = parseNumber(el.value1.value);
  const v2 = parseNumber(el.value2.value);
  const l1 = unitLabel(activeType, u1);
  const l2 = unitLabel(activeType, u2);

  if (op === 'convert') {
    if (v1 == null) return null;
    const out = convertVal(v1, u1, u2);
    if (out == null) return null;
    return {
      measurementType: activeType,
      measurementLabel: MEASUREMENTS[activeType]?.label ?? activeType,
      operation: opUpper,
      fromValue: fmt(v1),
      fromUnitId: u1,
      fromUnitLabel: l1,
      toValue: fmt(out),
      toUnitId: u2,
      toUnitLabel: l2,
      value2: '',
      value2UnitLabel: '',
      createdAt: new Date().toISOString(),
    };
  }

  if (v1 == null || v2 == null) return null;
  const n1 = convertVal(v1, u1, u2);
  if (n1 == null) return null;
  const n2 = v2;

  if (op === 'compare') {
    const eps = 1e-9 * Math.max(1, Math.abs(n1), Math.abs(n2));
    let cmpText = 'Equal';
    if (Math.abs(n1 - n2) > eps) cmpText = n1 > n2 ? 'First value greater' : 'Second value greater';
    return {
      measurementType: activeType,
      measurementLabel: MEASUREMENTS[activeType]?.label ?? activeType,
      operation: opUpper,
      fromValue: fmt(v1),
      fromUnitId: u1,
      fromUnitLabel: l1,
      toValue: cmpText,
      toUnitId: u2,
      toUnitLabel: l2,
      value2: fmt(v2),
      value2UnitLabel: l2,
      createdAt: new Date().toISOString(),
    };
  }

  let out = null;
  if (op === 'add') out = n1 + n2;
  if (op === 'subtract') out = n1 - n2;
  if (op === 'divide') out = n2 === 0 ? null : n1 / n2;
  if (out == null || !Number.isFinite(out)) return null;

  return {
    measurementType: activeType,
    measurementLabel: MEASUREMENTS[activeType]?.label ?? activeType,
    operation: opUpper,
    fromValue: fmt(v1),
    fromUnitId: u1,
    fromUnitLabel: l1,
    toValue: fmt(out),
    toUnitId: u2,
    toUnitLabel: l2,
    value2: fmt(v2),
    value2UnitLabel: l2,
    createdAt: new Date().toISOString(),
  };
}

async function saveToHistory() {
  const payload = buildHistoryPayload();
  if (!payload) {
    setStatus('Enter valid values for the selected operation.');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Save failed (${res.status})`);
    setStatus('Saved to History.');
  } catch (e) {
    setStatus(`Could not save. Start JSON Server at ${API_BASE}. (${e?.message ?? e})`);
  }
}

function showHistoryError(msg) {
  if (!msg) {
    el.historyError.hidden = true;
    el.historyError.textContent = '';
    return;
  }
  el.historyError.hidden = false;
  el.historyError.textContent = msg;
}

async function clearHistory() {
  if (!window.QMAuth?.isSignedIn?.()) return;
  showHistoryError('');
  try {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      await fetchHistory();
      return;
    }
    for (const item of items) {
      await fetch(`${API_BASE}/history/${item.id}`, { method: 'DELETE' });
    }
    await fetchHistory();
  } catch (e) {
    showHistoryError(`Could not clear history. (${e?.message ?? e})`);
  }
}

function openModal() {
  el.historyModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  el.historyModal.hidden = true;
  document.body.style.overflow = '';
}

function wireEvents() {
  for (const tab of el.tabs) {
    tab.addEventListener('click', () => setActiveType(tab.dataset.type));
  }
  el.operation.addEventListener('change', toggleOperationUI);
  el.value1.addEventListener('input', runCompute);
  el.unit1.addEventListener('change', runCompute);
  el.value2.addEventListener('input', runCompute);
  el.unit2.addEventListener('change', runCompute);
  el.swapBtn.addEventListener('click', swapUnits);
  el.saveBtn.addEventListener('click', saveToHistory);
  el.historyBtn.addEventListener('click', () => {
    window.location.href = './signup.html?next=history';
  });
  el.refreshHistoryBtn.addEventListener('click', fetchHistory);
  el.clearHistoryBtn.addEventListener('click', clearHistory);
  el.historyModal.addEventListener('click', (e) => {
    if (e.target?.dataset?.close === 'true') closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (!el.historyModal.hidden && e.key === 'Escape') closeModal();
  });
}

function applyAuthHeader() {
  const signedIn = window.QMAuth?.isSignedIn?.() ?? false;
  const loginLink = document.getElementById('loginLink');
  const logoutBtn = document.getElementById('logoutBtn');
  const userNameText = document.getElementById('userNameText');
  if (loginLink) loginLink.hidden = signedIn;
  if (logoutBtn) logoutBtn.hidden = !signedIn;
  if (userNameText) userNameText.textContent = signedIn ? (window.QMAuth?.getDisplayName?.() ?? '') : '';
}

function maybeOpenHistoryFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('openHistory') !== '1') return;
  const cleanUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('openHistory');
    const qs = url.searchParams.toString();
    window.history.replaceState({}, '', url.pathname + (qs ? `?${qs}` : '') + url.hash);
  };
  if (!window.QMAuth?.isSignedIn?.()) {
    cleanUrl();
    return;
  }
  cleanUrl();
  openModal();
  fetchHistory();
}

wireEvents();
setActiveType('length');
toggleOperationUI();
applyAuthHeader();
maybeOpenHistoryFromQuery();

document.getElementById('logoutBtn')?.addEventListener('click', () => window.QMAuth?.signOut?.());
