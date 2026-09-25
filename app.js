var PLACES = window.PLACES || [];
(function () {
  // ---- categories ----
  var CATS = {
    shopping: { label: 'Shopping', color: '#D2691E' },
    see: { label: 'To see', color: '#2B5FD9' },
    adventures: { label: 'Adventures', color: '#1F8A4C' },
    other: { label: 'Food & bars', color: '#8A3FC7' }
  };
  var hiddenCats = {};
  try { hiddenCats = JSON.parse(localStorage.getItem('japan2026-hidden') || '{}'); } catch (e) {}

  // ---- map ----
  var map = null, markers = {}, layers = {}, userMarker = null, userCircle = null, userPos = null, watchId = null, firstFix = true;
  var TOKYO = [[35.60, 139.60], [35.78, 139.84]];

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.hidden = true; }, 4000);
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function popupHtml(p) {
    return '<b>' + esc(p.name) + '</b>' +
      (p.note ? '<span class="pn">' + esc(p.note) + '</span>' : '') +
      (p.approx ? '<span class="pn">Pin is approximate.</span>' : '') +
      '<a class="gm" href="' + esc(p.url) + '" target="_blank" rel="noopener">Open in Google Maps</a>';
  }

  function tileUrl() {
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return 'https://{s}.basemaps.cartocdn.com/' + (dark ? 'dark_all' : 'rastertiles/voyager') + '/{z}/{x}/{y}{r}.png';
  }

  function initMap() {
    if (map || !window.L) return !!map;
    map = L.map('map', { zoomControl: false, tap: true }).fitBounds(TOKYO);
    L.tileLayer(tileUrl(), {
      maxZoom: 19, subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    Object.keys(CATS).forEach(function (c) { layers[c] = L.layerGroup(); if (!hiddenCats[c]) layers[c].addTo(map); });
    PLACES.forEach(function (p) {
      var m = L.circleMarker([p.lat, p.lng], {
        radius: 10, color: '#fff', weight: 2.5, fillColor: CATS[p.cat].color, fillOpacity: 1,
        dashArray: p.approx ? '3 3' : null
      }).bindPopup(popupHtml(p), { maxWidth: 280, autoPanPaddingTopLeft: [10, 80] });
      m.addTo(layers[p.cat]);
      markers[p.id] = m;
    });
    buildChips();
    return true;
  }

  function buildChips() {
    var box = document.getElementById('chips');
    Object.keys(CATS).forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chip';
      b.setAttribute('aria-pressed', hiddenCats[c] ? 'false' : 'true');
      b.innerHTML = '<i style="background:' + CATS[c].color + '"></i>' + CATS[c].label;
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') === 'true';
        b.setAttribute('aria-pressed', on ? 'false' : 'true');
        if (on) { map.removeLayer(layers[c]); hiddenCats[c] = 1; } else { layers[c].addTo(map); delete hiddenCats[c]; }
        try { localStorage.setItem('japan2026-hidden', JSON.stringify(hiddenCats)); } catch (e) {}
        updateNear();
      });
      box.appendChild(b);
    });
  }

  function showCat(c) {
    if (hiddenCats[c]) {
      layers[c].addTo(map); delete hiddenCats[c];
      var chips = document.querySelectorAll('.chip');
      Object.keys(CATS).forEach(function (k, i) { if (k === c) chips[i].setAttribute('aria-pressed', 'true'); });
    }
  }

  function focusPlace(id) {
    var p = PLACES.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    show('map', true);
    setTimeout(function () {
      if (!initMap()) return;
      map.invalidateSize();
      showCat(p.cat);
      map.setView([p.lat, p.lng], Math.max(map.getZoom(), 16));
      markers[id].openPopup();
    }, 60);
  }

  // ---- location ----
  function dist(a, b) {
    var R = 6371000, toR = Math.PI / 180;
    var dLat = (b[0] - a[0]) * toR, dLng = (b[1] - a[1]) * toR;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function fmt(m) { return m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m < 10000 ? (m / 1000).toFixed(1) : Math.round(m / 1000)) + ' km'; }

  function updateNear() {
    var box = document.getElementById('near');
    if (!userPos) { box.hidden = true; return; }
    var list = PLACES.filter(function (p) { return !hiddenCats[p.cat]; })
      .map(function (p) { return { p: p, d: dist(userPos, [p.lat, p.lng]) }; })
      .sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
    if (!list.length || list[0].d > 30000) { box.hidden = true; return; }
    box.innerHTML = '<p>Closest to you</p>' + list.map(function (x) {
      return '<button data-id="' + x.p.id + '"><span>' + esc(x.p.name) + '</span><span>' + fmt(x.d) + '</span></button>';
    }).join('');
    box.hidden = false;
    box.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { focusPlace(+b.dataset.id); });
    });
  }

  function onPos(pos) {
    userPos = [pos.coords.latitude, pos.coords.longitude];
    document.getElementById('toast').hidden = true;
    var acc = pos.coords.accuracy;
    if (!userMarker) {
      userMarker = L.marker(userPos, { icon: L.divIcon({ className: '', html: '<div class="userdot"></div>', iconSize: [18, 18] }), interactive: false, zIndexOffset: 1000 }).addTo(map);
      userCircle = L.circle(userPos, { radius: acc, color: '#1a73e8', weight: 1, fillColor: '#1a73e8', fillOpacity: 0.12, interactive: false }).addTo(map);
    } else { userMarker.setLatLng(userPos); userCircle.setLatLng(userPos).setRadius(acc); }
    if (firstFix) { firstFix = false; map.setView(userPos, 16); }
    updateNear();
  }
  function onErr(err) {
    document.getElementById('locate').classList.remove('on');
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
    toast(err.code === 1 ? 'Location is blocked. Allow it for this site in Chrome settings.' : 'Could not find your location. Try again outside.');
  }
  // Start tracking without a tap if this browser has already been given permission.
  // Only runs when the Permissions API can confirm it, so a first-time visitor
  // never gets an unprompted location request.
  function autoLocate() {
    if (!navigator.geolocation || !navigator.permissions || watchId !== null) return;
    navigator.permissions.query({ name: 'geolocation' }).then(function (p) {
      if (p.state === 'granted') locate();
    }).catch(function () {});
  }

  function locate() {
    if (!navigator.geolocation) { toast('This browser cannot share location.'); return; }
    if (watchId !== null && userPos) { map.setView(userPos, Math.max(map.getZoom(), 16)); return; }
    document.getElementById('locate').classList.add('on');
    firstFix = true;
    toast('Finding you…');
    watchId = navigator.geolocation.watchPosition(onPos, onErr, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
  }

  // ---- tabs ----
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs button'));
  function show(name, push) {
    if (!tabs.some(function (t) { return t.dataset.tab === name; })) name = 'shopping';
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById('p-' + t.dataset.tab).hidden = !on;
    });
    document.body.classList.toggle('maptab', name === 'map');
    try { localStorage.setItem('japan2026-tab', name); } catch (e) {}
    if (push) { try { history.replaceState(null, '', '#' + name); } catch (e) {} window.scrollTo(0, 0); }
    if (name === 'map') { setTimeout(function () { if (initMap()) { map.invalidateSize(); autoLocate(); } }, 30); }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.dataset.tab, true); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus(); show(n.dataset.tab, true);
    });
  });

  document.querySelectorAll('.pin').forEach(function (b) {
    b.addEventListener('click', function () { focusPlace(+b.dataset.id); });
  });
  document.getElementById('locate').addEventListener('click', function () { if (initMap()) locate(); });
  document.getElementById('fitTokyo').addEventListener('click', function () { if (initMap()) map.fitBounds(TOKYO); });
  document.getElementById('fitAll').addEventListener('click', function () {
    if (!initMap()) return;
    map.fitBounds(PLACES.map(function (p) { return [p.lat, p.lng]; }), { padding: [30, 30] });
  });

  var start = location.hash.slice(1);
  if (!start) { try { start = localStorage.getItem('japan2026-tab') || ''; } catch (e) {} }
  show(start || 'shopping', false);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
