/* Ce fichier est relié à index.html par <script src="script.js"></script>
Il utilise les id de index.html (ex. #matricule, #calendar) et les classes de style.css (ex. .stamp.on, .day.pick). */
const PRIX_ACHAT = 60, MIN_KG = 2, TAMPONS_CARTE = 12, BONUS = 250, PAS_JOURS = 2;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fcfa = n => n.toLocaleString('fr-FR') + ' FCFA';
const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const toUTC = s => { const [y,m,d] = s.split('-').map(Number); return Date.UTC(y,m-1,d); };
const diffDays = (a,b) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
const today = iso(new Date());

/* ---------- Données (enregistrées dans le navigateur) ---------- */
const demo = () => ({
anchor: '2026-01-01',
people: [
{id:'BG-6801', nom:'Awa Sarr', quartier:'Dakar', tel:'', stamps:0, cartes:0, kg:0, paye:0, last:null, histo:[]},
{id:'BG-6802', nom:'Mariétou Lassana', quartier:'Dakar', tel:'', stamps:0, cartes:0, kg:0, paye:0, last:null, histo:[]},
{id:'BG-6803', nom:'Binetou Cheikh Ly', quartier:'Dakar', tel:'', stamps:0, cartes:0, kg:0, paye:0, last:null, histo:[]},
{id:'BG-6804', nom:'KOUYI ODZOUE Gilles Emmanuel', quartier:'Dakar', tel:'', stamps:0, cartes:0, kg:0, paye:0, last:null, histo:[]},
{id:'BG-6805', nom:'Adja Sarata GUEYE', quartier:'Dakar', tel:'', stamps:0, cartes:0, kg:0, paye:0, last:null, histo:[]},
{id:'BG-6806', nom:'Aicha Ngoné Sarr', quartier:'Dakar', tel:'', stamps:0, cartes:0, kg:0, paye:0, last:null, histo:[]},
{id:'BG-6807', nom:'Djieyna Hanne', quartier:'Dakar', tel:'', stamps:0, cartes:0, kg:0, paye:0, last:null, histo:[]}],
collectors: []
});
let db;
try { db = JSON.parse(localStorage.getItem('basmagh2')) || demo(); } catch { db = demo(); }
const save = () => { try { localStorage.setItem('basmagh2', JSON.stringify(db)); } catch {} };

/* ---------- Onglets ---------- */
$('nav').addEventListener('click', e => {
const t = e.target.dataset.tab; if (!t) return;
document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b === e.target));
document.querySelectorAll('.tab').forEach(s => s.classList.toggle('on', s.id === 'tab-' + t));
});

/* ---------- Carte à tampons ---------- */
let current = null;
function showCard(p) {
current = p; $('cardView').hidden = false;
$('cNom').textContent = p.nom; $('cMat').textContent = p.id;
$('cInfo').textContent = 'Quartier : ' + p.quartier + (p.tel ? ' – ' + p.tel : '');
$('stamps').innerHTML = Array.from({length: TAMPONS_CARTE}, (_, i) =>
`<div class="stamp ${i < p.stamps ? 'on' : ''}">${i < p.stamps ? 'B' : i + 1}</div>`).join('');
$('cTampons').textContent = p.stamps + ' / ' + TAMPONS_CARTE;
$('cCartes').textContent = p.cartes; $('cKg').textContent = p.kg + ' kg'; $('cPaye').textContent = fcfa(p.paye);
$('histo').innerHTML = p.histo.length ? p.histo.slice().reverse().map(h => `<li>${esc(h)}</li>`).join('') : '<li>Aucun apport pour le moment.</li>';
}
$('formSearch').addEventListener('submit', e => {
e.preventDefault();
const m = $('matricule').value.trim().toUpperCase();
const p = db.people.find(x => x.id === m);
$('searchMsg').className = 'msg ' + (p ? 'ok' : 'no');
$('searchMsg').textContent = p ? '' : 'Matricule introuvable. Vérifie le code sur la carte ou crée la carte dans l’onglet Personnes.';
if (p) showCard(p); else $('cardView').hidden = true;
});
$('dateApport').value = today;
$('formApport').addEventListener('submit', e => {
e.preventDefault(); if (!current) return;
const kg = parseFloat($('kg').value), date = $('dateApport').value, p = current;
const paie = Math.round(kg * PRIX_ACHAT);
let txt = `${date} : ${kg} kg, payé ${fcfa(paie)}`, msg = '', ok = true;
p.kg += kg; p.paye += paie;
if (kg < MIN_KG) { msg = `Moins de ${MIN_KG} kg : payé, mais pas de tampon.`; ok = false; }
else if (p.last && diffDays(p.last, date) < PAS_JOURS) { msg = 'Déjà un tampon il y a moins de 2 jours : payé, mais pas de tampon.'; ok = false; }
else {
p.stamps++; p.last = date; msg = 'Tampon ajouté.'; txt += ' + 1 tampon';
if (p.stamps === TAMPONS_CARTE) { p.stamps = 0; p.cartes++; p.paye += BONUS; msg = `Carte pleine ! Bonus de ${fcfa(BONUS)} à remettre.`; txt += ` + bonus ${fcfa(BONUS)}`; }
}
p.histo.push(txt); save(); showCard(p); renderPeople();
$('apportMsg').className = 'msg ' + (ok ? 'ok' : 'no'); $('apportMsg').textContent = `À payer : ${fcfa(paie)}. ` + msg;
});

/* ---------- Participants et collecteurs ---------- */
const nextId = (list, prefix, pad) => prefix + String(list.length + 1).padStart(pad, '0');
function renderPeople() {
$('tPeople').innerHTML = '<tr><th>Matricule</th><th>Nom</th><th>Quartier</th><th>Tampons</th><th>Cartes</th><th>Kg</th><th>Payé</th></tr>' +
db.people.map(p => `<tr><td>${esc(p.id)}</td><td>${esc(p.nom)}</td><td>${esc(p.quartier)}</td><td>${p.stamps}/${TAMPONS_CARTE}</td><td>${p.cartes}</td><td>${p.kg}</td><td>${fcfa(p.paye)}</td></tr>`).join('');
$('tCollectors').innerHTML = '<tr><th>Matricule</th><th>Nom</th><th>Zone</th><th>Téléphone</th></tr>' +
db.collectors.map(c => `<tr><td>${esc(c.id)}</td><td>${esc(c.nom)}</td><td>${esc(c.zone)}</td><td>${esc(c.tel)}</td></tr>`).join('');
}
$('formPerson').addEventListener('submit', e => {
e.preventDefault();
const p = {id: nextId(db.people, 'BG-68', 2), nom: $('pNom').value.trim(), quartier: $('pQuartier').value.trim(), tel: $('pTel').value.trim(), stamps:0, cartes:0, kg:0, paye:0, last:null, histo:[]};
db.people.push(p); save(); renderPeople(); e.target.reset();
$('pMsg').className = 'msg ok'; $('pMsg').textContent = 'Carte créée. Matricule à écrire sur la carte : ' + p.id;
});
$('formCollector').addEventListener('submit', e => {
e.preventDefault();
db.collectors.push({id: nextId(db.collectors, 'C-', 2), nom: $('kNom').value.trim(), zone: $('kZone').value.trim(), tel: $('kTel').value.trim()});
save(); renderPeople(); renderPlanning(); e.target.reset();
});

/* ---------- Planning 2026 : un ramassage tous les 2 jours à partir de la date d'ancrage ---------- */
let view = new Date(2026, today.startsWith('2026') ? new Date().getMonth() : 0, 1);
const isPickup = d => { const k = diffDays(db.anchor, d); return d.startsWith('2026') && k % PAS_JOURS === 0; };
function collectorFor(d) { const n = db.collectors.length; if (!n) return '—'; const k = Math.floor(diffDays('2026-01-01', d) / PAS_JOURS); return db.collectors[((k % n) + n) % n].nom; }
function renderPlanning() {
$('anchor').value = db.anchor;
$('monthTitle').textContent = view.toLocaleDateString('fr-FR', {month:'long', year:'numeric'});
const first = new Date(view.getFullYear(), view.getMonth(), 1), last = new Date(view.getFullYear(), view.getMonth() + 1, 0);
let h = ['L','M','M','J','V','S','D'].map(x => `<div class="dow">${x}</div>`).join('');
h += '<div class="day void"></div>'.repeat((first.getDay() + 6) % 7);
for (let n = 1; n <= last.getDate(); n++) {
const d = iso(new Date(view.getFullYear(), view.getMonth(), n));
h += `<div class="day ${isPickup(d) ? 'pick' : ''} ${d === today ? 'now' : ''}">${n}</div>`;
}
$('calendar').innerHTML = h;
let ref = today.startsWith('2026') ? today : '2026-01-01', out = [];
for (let i = 0; out.length < 5 && i < 366; i++) {
const d = iso(new Date(toUTC(ref) + i * 86400000 + 12 * 3600000));
if (isPickup(d)) out.push(`<li><strong>${new Date(toUTC(d) + 12 * 3600000).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'})}</strong> – collecteur : ${esc(collectorFor(d))}</li>`);
}
$('nextList').innerHTML = out.join('') || '<li>Plus de collecte prévue en 2026.</li>';
}
$('anchor').addEventListener('change', e => { if (e.target.value) { db.anchor = e.target.value; save(); renderPlanning(); } });
$('btnToday').addEventListener('click', () => {
if (!today.startsWith('2026')) { alert('Le planning couvre uniquement l’année 2026.'); return; }
db.anchor = today; save(); renderPlanning();
});
$('prev').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderPlanning(); });
$('next').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderPlanning(); });

renderPeople(); renderPlanning();