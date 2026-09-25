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
  var map = null, markers = {}, info = null, mapReady = null;
  var userMarker = null, userCircle = null, userPos = null, watchId = null, firstFix = true;
  var TOKYO = { south: 35.60, west: 139.60, north: 35.78, east: 139.84 };

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.hidden = true; }, 4000);
  }

  function zoomAtLeast(n) {
    var z = map.getZoom();
    map.setZoom(typeof z === 'number' ? Math.max(z, n) : n);
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function popupHtml(p) {
    return '<div class="pop"><b>' + esc(p.name) + '</b>' +
      (p.note ? '<span class="pn">' + esc(p.note) + '</span>' : '') +
      (p.approx ? '<span class="pn">Pin is approximate.</span>' : '') +
      '<a class="gm" href="' + esc(p.url) + '" target="_blank" rel="noopener">Open in Google Maps</a></div>';
  }

  function dotFor(p) {
    var d = document.createElement('div');
    d.className = 'dot';
    d.style.background = CATS[p.cat].color;
    return d;
  }

  // Resolves once the Maps library has loaded and the map exists. Every caller
  // goes through this because the API script is fetched on demand.
  function initMap() {
    if (mapReady) return mapReady;
    mapReady = Promise.all([
      google.maps.importLibrary('maps'),
      google.maps.importLibrary('marker'),
      google.maps.importLibrary('core')
    ]).then(function (libs) {
      var Map = libs[0].Map;
      var AdvancedMarkerElement = libs[1].AdvancedMarkerElement;
      var ColorScheme = libs[2].ColorScheme;
      map = new Map(document.getElementById('map'), {
        mapId: window.GMAPS.mapId,
        colorScheme: ColorScheme.FOLLOW_SYSTEM,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        clickableIcons: false
      });
      map.fitBounds(TOKYO);
      info = new google.maps.InfoWindow({ maxWidth: 280 });
      PLACES.forEach(function (p) {
        var m = new AdvancedMarkerElement({
          map: hiddenCats[p.cat] ? null : map,
          position: { lat: p.lat, lng: p.lng },
          content: dotFor(p),
          title: p.name,
          gmpClickable: true
        });
        m.addEventListener('gmp-click', function () { openPopup(p); });
        markers[p.id] = m;
      });
      buildChips();
      return map;
    }).catch(function (e) {
      mapReady = null;
      toast('The map could not load. Check your connection.');
      throw e;
    });
    return mapReady;
  }

  function openPopup(p) {
    info.setContent(popupHtml(p));
    info.open({ map: map, anchor: markers[p.id] });
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
        if (on) { hiddenCats[c] = 1; } else { delete hiddenCats[c]; }
        applyCat(c);
        try { localStorage.setItem('japan2026-hidden', JSON.stringify(hiddenCats)); } catch (e) {}
        updateNear();
      });
      box.appendChild(b);
    });
  }

  function applyCat(c) {
    PLACES.forEach(function (p) {
      if (p.cat === c) markers[p.id].map = hiddenCats[c] ? null : map;
    });
  }

  function showCat(c) {
    if (!hiddenCats[c]) return;
    delete hiddenCats[c];
    applyCat(c);
    var chips = document.querySelectorAll('.chip');
    Object.keys(CATS).forEach(function (k, i) { if (k === c) chips[i].setAttribute('aria-pressed', 'true'); });
  }

  function focusPlace(id) {
    var p = PLACES.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    show('map', true);
    initMap().then(function () {
      showCat(p.cat);
      map.panTo({ lat: p.lat, lng: p.lng });
      zoomAtLeast(16);
      openPopup(p);
    }).catch(function () {});
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
    var here = { lat: userPos[0], lng: userPos[1] }, acc = pos.coords.accuracy;
    if (!map) { updateNear(); return; }
    if (!userMarker) {
      var dot = document.createElement('div');
      dot.className = 'userdot';
      userMarker = new (google.maps.marker.AdvancedMarkerElement)({
        map: map, position: here, content: dot, zIndex: 1000
      });
      userCircle = new google.maps.Circle({
        map: map, center: here, radius: acc, clickable: false,
        strokeColor: '#1a73e8', strokeWeight: 1, strokeOpacity: 0.5,
        fillColor: '#1a73e8', fillOpacity: 0.12
      });
    } else {
      userMarker.position = here;
      userCircle.setCenter(here); userCircle.setRadius(acc);
    }
    if (firstFix) { firstFix = false; map.panTo(here); map.setZoom(16); }
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
    if (watchId !== null && userPos) {
      if (map) { map.panTo({ lat: userPos[0], lng: userPos[1] }); zoomAtLeast(16); }
      return;
    }
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
    if (name === 'map') { initMap().then(autoLocate).catch(function () {}); }
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
  document.getElementById('locate').addEventListener('click', function () {
    initMap().then(locate).catch(function () {});
  });

  var start = location.hash.slice(1);
  if (!start) { try { start = localStorage.getItem('japan2026-tab') || ''; } catch (e) {} }
  show(start || 'shopping', false);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
