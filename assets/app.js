/* COMITES 2026 - preenchimento do PDF no próprio navegador.
   O modelo oficial (assets/modelo-original.pdf) vai embutido em base64 em assets/template.js
   e o texto é desenhado por cima, nas coordenadas do formulário. */

(function () {
  'use strict';

  var PDFLib = window.PDFLib;
  var EMAIL_CONSULADO = 'riodejaneiro.elettorale@esteri.it';
  var STORE = 'comites2026';

  /* Coordenadas em pontos do PDF (origem no canto inferior esquerdo, página 612x792).
     align: 'left' usa x como início; 'center' usa x como centro do campo. */
  var FIELDS = {
    consolatoTop:  { x: 252,   y: 670.1, w: 284, align: 'left'   },
    nome:          { x: 197.5, y: 640.8, w: 148, align: 'center' },
    cognome:       { x: 347.5, y: 640.8, w: 196, align: 'center' },
    dia:           { x: 98,    y: 596.9, w: 26,  align: 'center' },
    mes:           { x: 138.3, y: 596.9, w: 38,  align: 'center' },
    ano:           { x: 187,   y: 596.9, w: 42,  align: 'center' },
    cidadeNasc:    { x: 225,   y: 596.9, w: 303, align: 'left'   },
    paisNasc:      { x: 118,   y: 567.5, w: 243, align: 'left'   },
    codiceFiscale: { x: 202,   y: 538.3, w: 330, align: 'left'   },
    telefone:      { x: 138,   y: 509.0, w: 390, align: 'left'   },
    email:         { x: 210,   y: 479.7, w: 320, align: 'left'   },
    comites:       { x: 357,   y: 369.8, w: 140, align: 'center' },
    consolato:     { x: 288,   y: 347.8, w: 196, align: 'center' },
    via:           { x: 93,    y: 237.9, w: 341, align: 'left'   },
    numero:        { x: 491,   y: 237.9, w: 76,  align: 'center' },
    cidade:        { x: 65,    y: 208.6, w: 198, align: 'left'   },
    cap:           { x: 293,   y: 208.6, w: 86,  align: 'left'   },
    pais:          { x: 415,   y: 208.6, w: 116, align: 'left'   },
    luogoData:     { x: 106,   y: 164.7, w: 127, align: 'left'   }
  };
  var SIGN = { cx: 400, base: 166.5, w: 250, h: 34 };
  var BASE_SIZE = 11, MIN_SIZE = 6, LIFT = 1.8;

  var $ = function (id) { return document.getElementById(id); };
  var form = $('form');
  var lastBlob = null, lastName = '';

  /* ---------- texto ---------- */

  // O modelo usa fontes padrão (WinAnsi). Troca aspas/traços tipográficos e
  // remove o que estiver fora dessa tabela, para o pdf-lib não quebrar.
  function sanitize(s) {
    return String(s == null ? '' : s)
      .normalize('NFC')
      .replace(/[‘’‛]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[‐-―]/g, '-')
      .replace(/…/g, '...')
      .replace(/\s+/g, ' ')
      .trim()
      .split('')
      .filter(function (c) { var n = c.charCodeAt(0); return n === 32 || (n >= 33 && n <= 126) || (n >= 160 && n <= 255); })
      .join('');
  }

  function fitSize(font, text, maxW) {
    var size = BASE_SIZE;
    while (size > MIN_SIZE && font.widthOfTextAtSize(text, size) > maxW) size -= 0.25;
    return size;
  }

  function draw(page, font, key, raw) {
    var f = FIELDS[key];
    var text = sanitize(raw);
    if (!f || !text) return;
    var size = fitSize(font, text, f.w);
    var width = font.widthOfTextAtSize(text, size);
    var x = f.align === 'center' ? f.x - width / 2 : f.x;
    page.drawText(text, { x: x, y: f.y + LIFT, size: size, font: font, color: PDFLib.rgb(0.07, 0.09, 0.35) });
  }

  /* ---------- assinatura ---------- */

  var canvas = $('sig'), ctx = canvas.getContext('2d'), hasInk = false, drawing = false, last = null;

  function sizeCanvas() {
    var r = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var data = hasInk ? canvas.toDataURL() : null;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.4 * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#12206b';
    if (data) { var img = new Image(); img.onload = function () { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); }; img.src = data; }
  }

  function pos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  }

  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    drawing = true; last = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(last.x + 0.1, last.y); ctx.stroke();
    hasInk = true; canvas.parentNode.classList.add('has-ink');
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    e.preventDefault();
    var p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    canvas.addEventListener(ev, function () { drawing = false; });
  });
  $('clearSig').addEventListener('click', function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk = false; canvas.parentNode.classList.remove('has-ink');
  });
  window.addEventListener('resize', sizeCanvas);

  // Recorta o traço e devolve PNG com fundo transparente.
  function signaturePng() {
    if (!hasInk) return null;
    var img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0, found = false;
    for (var y = 0; y < canvas.height; y++) {
      for (var x = 0; x < canvas.width; x++) {
        if (img[(y * canvas.width + x) * 4 + 3] > 12) {
          found = true;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (!found) return null;
    var pad = 6;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(canvas.width - 1, maxX + pad); maxY = Math.min(canvas.height - 1, maxY + pad);
    var out = document.createElement('canvas');
    out.width = maxX - minX + 1; out.height = maxY - minY + 1;
    out.getContext('2d').drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
  }

  /* ---------- formulário ---------- */

  var REQUIRED = ['nome', 'cognome', 'nascimento', 'cidadeNasc', 'paisNasc', 'telefone', 'via', 'numero', 'cidade', 'cap', 'pais', 'luogo', 'data', 'consolatoTop', 'comites', 'consolato'];

  function values() {
    var v = {};
    Array.prototype.forEach.call(form.elements, function (el) { if (el.id) v[el.id] = (el.value || '').trim(); });
    return v;
  }

  function validate(v) {
    var missing = [];
    REQUIRED.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      if (!v[id]) { missing.push(id); el.classList.add('err'); } else el.classList.remove('err');
    });
    return missing;
  }

  function say(msg, ok) {
    var box = $('alert');
    box.textContent = msg;
    box.className = 'alert' + (ok ? ' ok' : '');
    box.hidden = !msg;
    if (msg) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function up(s) { return (s || '').toLocaleUpperCase('pt-BR'); }

  function brDate(iso) {
    if (!iso) return { d: '', m: '', a: '', full: '' };
    var p = iso.split('-');
    return { d: p[2], m: p[1], a: p[0], full: p[2] + '/' + p[1] + '/' + p[0] };
  }

  function fileName(v) {
    var base = ('COMITES-2026-' + up(v.nome) + '-' + up(v.cognome))
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return base + '.pdf';
  }

  /* ---------- geração ---------- */

  function b64ToBytes(b64) {
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function build(v) {
    var pdf = await PDFLib.PDFDocument.load(b64ToBytes(window.COMITES_TEMPLATE_B64));
    var font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    var page = pdf.getPages()[0];
    var nasc = brDate(v.nascimento), assin = brDate(v.data);
    var rua = up(v.via) + (v.complemento ? ', ' + up(v.complemento) : '');

    draw(page, font, 'consolatoTop', up(v.consolatoTop));
    draw(page, font, 'nome', up(v.nome));
    draw(page, font, 'cognome', up(v.cognome));
    draw(page, font, 'dia', nasc.d);
    draw(page, font, 'mes', nasc.m);
    draw(page, font, 'ano', nasc.a);
    draw(page, font, 'cidadeNasc', up(v.cidadeNasc));
    draw(page, font, 'paisNasc', up(v.paisNasc));
    draw(page, font, 'codiceFiscale', up(v.codiceFiscale));
    draw(page, font, 'telefone', v.telefone);
    draw(page, font, 'email', v.email);
    draw(page, font, 'comites', up(v.comites));
    draw(page, font, 'consolato', up(v.consolato));
    draw(page, font, 'via', rua);
    draw(page, font, 'numero', up(v.numero));
    draw(page, font, 'cidade', up(v.cidade));
    draw(page, font, 'cap', v.cap);
    draw(page, font, 'pais', up(v.pais));
    draw(page, font, 'luogoData', up(v.luogo) + ', ' + assin.full);

    var sig = signaturePng();
    if (sig) {
      var png = await pdf.embedPng(sig);
      var scale = Math.min(SIGN.w / png.width, SIGN.h / png.height);
      var w = png.width * scale, h = png.height * scale;
      page.drawImage(png, { x: SIGN.cx - w / 2, y: SIGN.base, width: w, height: h });
    }

    pdf.setTitle('Domanda di iscrizione elenco elettorale COMITES 2026');
    pdf.setSubject('COMITES 2026 - ' + up(v.nome) + ' ' + up(v.cognome));
    return pdf.save();
  }

  function mailtoLink(v) {
    var nome = up(v.nome) + ' ' + up(v.cognome);
    var body =
      'Gentilissimi,\n\n' +
      'in allegato invio la domanda di iscrizione nell\'elenco elettorale per le elezioni dei COMITES 2026, ' +
      'insieme alla copia di un documento di identita\' con firma.\n\n' +
      'Nome: ' + nome + '\n' +
      'Data di nascita: ' + brDate(v.nascimento).full + '\n' +
      'Telefono: ' + v.telefone + '\n\n' +
      'ANEXE O PDF GERADO E A COPIA DO DOCUMENTO DE IDENTIDADE ANTES DE ENVIAR.\n\n' +
      'Cordiali saluti,\n' + nome;
    return 'mailto:' + EMAIL_CONSULADO +
      '?subject=' + encodeURIComponent('Iscrizione elenco elettorale COMITES 2026 - ' + nome) +
      '&body=' + encodeURIComponent(body);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var v = values();
    var missing = validate(v);
    if (missing.length) {
      say('Preencha os campos obrigatórios em destaque (' + missing.length + ' pendente' + (missing.length > 1 ? 's' : '') + ').');
      var first = $(missing[0]);
      if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus({ preventScroll: true }); }
      return;
    }
    var btn = $('gen');
    btn.disabled = true; btn.textContent = 'Gerando...';
    try {
      var bytes = await build(v);
      lastBlob = new Blob([bytes], { type: 'application/pdf' });
      lastName = fileName(v);
      var url = URL.createObjectURL(lastBlob);

      var dl = $('download');
      dl.href = url; dl.setAttribute('download', lastName);
      $('resultName').textContent = lastName;
      $('mail').href = mailtoLink(v);
      $('preview').innerHTML = '<iframe title="Pré-visualização do PDF" src="' + url + '#zoom=page-fit"></iframe>';

      var shareBtn = $('share');
      var canShare = navigator.canShare && navigator.canShare({ files: [new File([lastBlob], lastName, { type: 'application/pdf' })] });
      shareBtn.hidden = !canShare;

      $('result').hidden = false;
      say('PDF gerado. Confira os dados antes de enviar.', true);
      $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
      save(v);
    } catch (err) {
      console.error(err);
      say('Não foi possível gerar o PDF: ' + (err && err.message ? err.message : err));
    } finally {
      btn.disabled = false; btn.textContent = 'Gerar PDF preenchido';
    }
  });

  $('share').addEventListener('click', async function () {
    if (!lastBlob) return;
    try {
      await navigator.share({
        files: [new File([lastBlob], lastName, { type: 'application/pdf' })],
        title: lastName,
        text: 'Domanda di iscrizione COMITES 2026'
      });
    } catch (err) { /* cancelado pelo usuário */ }
  });

  $('reset').addEventListener('click', function () {
    if (!confirm('Apagar todos os dados preenchidos?')) return;
    form.reset();
    try { localStorage.removeItem(STORE); } catch (e) {}
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk = false; canvas.parentNode.classList.remove('has-ink');
    $('result').hidden = true;
    say('');
    defaults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- persistência local ---------- */

  function save(v) {
    try { localStorage.setItem(STORE, JSON.stringify(v || values())); } catch (e) {}
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return;
      var v = JSON.parse(raw);
      Object.keys(v).forEach(function (k) { var el = $(k); if (el && v[k]) el.value = v[k]; });
    } catch (e) {}
  }

  function defaults() {
    if (!$('data').value) $('data').value = new Date().toISOString().slice(0, 10);
    if (!$('telefone').value) $('telefone').value = '+55 ';
    if (!$('consolatoTop').value) $('consolatoTop').value = 'RIO DE JANEIRO';
    if (!$('comites').value) $('comites').value = 'RJ/ES';
    if (!$('consolato').value) $('consolato').value = 'RIO DE JANEIRO';
    if (!$('paisNasc').value) $('paisNasc').value = 'BRASILE';
    if (!$('pais').value) $('pais').value = 'BRASILE';
  }

  // A cidade da residência preenche o local da assinatura, enquanto ele estiver vazio.
  $('cidade').addEventListener('blur', function () {
    if (!$('luogo').value) $('luogo').value = this.value;
  });

  form.addEventListener('input', function (e) {
    if (e.target.classList) e.target.classList.remove('err');
    save();
  });

  load();
  defaults();
  sizeCanvas();
})();
