const $ = s => document.querySelector(s);
const OK = /\.(js|jsx|ts|tsx|py|java|c|cc|cpp|h|hpp|cs|go|rs|rb|php|swift|kt|html|css|json|md|sh|sql|ya?ml|txt)$/i;
const GH = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
const out = $('#out'), drop = $('#drop'), picker = $('#picker'), flist = $('#flist');
const goFiles = $('#go-files'), goRepo = $('#go-repo'), repo = $('#repo');
const pickBar = $('#pick'), repoFile = $('#repo-file'), goOne = $('#go-one');
let files = [], repoUrl = null;

// Error boundary: any failure in a handler becomes a readable message with Retry.
function fail(msg, retry) {
  out.className = '';
  out.innerHTML = '<div class="error" role="alert"><p></p><button class="primary" type="button">Retry</button></div>';
  out.querySelector('p').textContent = msg;
  out.querySelector('button').onclick = retry;
  out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
const guard = fn => async (...a) => {
  try { await fn(...a); } catch (e) { console.error(e); fail(e.message || 'Something broke.', () => guard(fn)(...a)); }
};
window.addEventListener('error', () => fail('Something on this page broke.', () => location.reload()));

function renderFiles(note = '') {
  flist.innerHTML = '';
  files.forEach((f, i) => {
    const li = document.createElement('li');
    li.textContent = f.name;
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = 'remove';
    b.onclick = () => { files.splice(i, 1); renderFiles(); };
    li.append(b); flist.append(li);
  });
  goFiles.disabled = !files.length;
  $('#fnote').textContent = note;
}

const addFiles = guard(async list => {
  const skipped = [];
  for (const f of list) {
    if (!OK.test(f.name) || f.size > 150000) { skipped.push(f.name); continue; }
    const content = await f.text();
    if (content.includes('\0')) { skipped.push(f.name); continue; }
    files.push({ name: f.name, content });
  }
  files = files.slice(0, 20);
  renderFiles(skipped.length ? 'Skipped (not text code, or over 150 KB): ' + skipped.join(', ') : '');
});

drop.onclick = () => picker.click();
drop.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); picker.click(); } };
picker.onchange = () => { addFiles([...picker.files]); picker.value = ''; };
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('drag'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('drag'); }));
drop.addEventListener('drop', e => addFiles([...e.dataTransfer.files]));

function show(j, secs) {
  out.className = '';
  out.innerHTML = '<div class="md"></div><div class="meta"><span></span><button type="button">Copy explanation</button></div>';
  const md = out.querySelector('.md');
  if (window.marked && window.DOMPurify) md.innerHTML = DOMPurify.sanitize(marked.parse(j.markdown)); // model output is untrusted
  else { md.style.whiteSpace = 'pre-wrap'; md.textContent = j.markdown; }
  out.querySelector('span').textContent = `Explained by ${j.model} via ${j.provider} in ${secs.toFixed(1)} seconds, from ${j.files.length} file(s).`;
  out.querySelector('.meta button').onclick = e => { navigator.clipboard.writeText(j.markdown); e.target.textContent = 'Copied'; };

  // After a repo overview, offer every code file in that repo for a deep dive.
  if (repoFile.options.length) repoFile.innerHTML = '';
  if (Array.isArray(j.repoFiles) && j.repoFiles.length) {
    for (const p of j.repoFiles) {
      const o = document.createElement('option');
      o.value = o.textContent = p;
      repoFile.append(o);
    }
    pickBar.hidden = false;
  } else {
    pickBar.hidden = true;
  }
}

const run = guard(async payload => {
  document.body.classList.add('busy');
  goFiles.disabled = goRepo.disabled = goOne.disabled = true;
  out.className = '';
  out.innerHTML = '<p class="status"><span class="spin"></span>Reading the code and writing the explanation. This takes 10 to 40 seconds.</p>';
  const t0 = performance.now();
  try {
    const r = await fetch('/api/explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `The server answered ${r.status}. Is the backend running?`);
    show(j, (performance.now() - t0) / 1000);
  } finally {
    document.body.classList.remove('busy');
    goFiles.disabled = !files.length; goRepo.disabled = false; goOne.disabled = false;
  }
});

goFiles.onclick = () => run({ files });
$('#repo-box').onsubmit = e => {
  e.preventDefault();
  const url = repo.value.trim();
  if (!GH.test(url)) return fail('That is not a GitHub repo link. Use the form https://github.com/owner/repo', () => repo.focus());
  repoUrl = url;
  run({ repo: url });
};
goOne.onclick = () => {
  if (repoUrl && repoFile.value) run({ repo: repoUrl, path: repoFile.value });
};
