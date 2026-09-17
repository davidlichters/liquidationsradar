/* zaehl.js — was ein Besucher TUT, nicht nur dass er da war.
 *
 * ═══ WOZU, 17.09.2026 ═══
 * Seit dem 15.09. zaehlt die Seite Aufrufe: 404.html jeden Kurzlink,
 * index.html die Startseite. Was sie NICHT zaehlte, ist der Schritt danach.
 * `grep -c "goatcounter.count" index.html` gab 0, also war jeder Knopfdruck
 * unsichtbar.
 *
 * Warum das der Schritt ist, auf den es ankommt: bei 1.000 Zustellungen und
 * der am 16.09. gemessenen Klickrate von 4,2 % erwarten wir rund 42 Klicker.
 * Schreibt davon keiner, gibt es zwei voellig verschiedene Diagnosen mit zwei
 * verschiedenen Reparaturen. Entweder ueberzeugt die Seite nicht, dann liegt
 * es am Text. Oder sie ueberzeugt und die WhatsApp-Huerde ist zu hoch, dann
 * liegt es am Kanal. Ohne diese Zahl ist zwischen beiden nicht zu
 * unterscheiden, und rueckwirkend gibt es sie nie.
 *
 * ═══ DER NAME STEHT AM ELEMENT, NICHT HIER ═══
 * Jeder Handlungslink traegt data-zaehl="<name>". Wer einen Knopf hinzufuegt
 * und das Attribut vergisst, faellt bei `node werkzeug/knopf_probe.mjs` durch,
 * statt still nicht gezaehlt zu werden. Das ist derselbe Grund, aus dem der
 * Knopftext in seitenrueckweg_probe.mjs gegen zwei Repos gehalten wird: eine
 * Messstelle, von der niemand weiss, ob sie misst, liefert spaeter eine Zahl,
 * die kleiner ist als die Wahrheit.
 *
 * ═══ DER KLICK WIRD NICHT VERZOEGERT ═══
 * 404.html wartet bis zu 1,2 s auf das Zaehlbild, weil dort ohnehin
 * weitergeleitet wird und der Besucher wartet. Hier waere das falsch: ein
 * Knopf, der sich klebrig anfuehlt, kostet mehr Interessenten als eine
 * verlorene Zaehlung einbringt. fetch(keepalive) ueberlebt den Seitenwechsel,
 * ohne ihn aufzuhalten; wo es das nicht gibt, ein Bild als Rueckfall.
 *
 * Gemessen am 17.09.2026, bevor das hier gebaut wurde: der Endpunkt nimmt
 * Ereignisse per GET mit e=true an, und die API gibt sie mit dem Feld
 * "event": true zurueck. Die Trennung von Seitenaufruf und Knopfdruck ist
 * damit ein Feld und kein Namensraten.
 */
(function () {
  'use strict';
  var ZIEL = 'https://liquidationsradar.goatcounter.com/count';

  /* Der Ort, aus dem der Besucher kommt. 404.html legt ihn beim Kurzlink in
     den sessionStorage, sonst steht er als ?o= in der Adresse. Er geht in den
     TITEL, nicht in den Pfad: 3.209 Ortscodes im Pfad wuerden die Zahl, um
     die es geht, in 3.209 Einsen zerlegen. */
  function ort() {
    try {
      var p = new URLSearchParams(location.search).get('o');
      if (p) return p;
      return sessionStorage.getItem('lr_ort') || '';
    } catch (e) { return ''; }
  }

  /* ═══ DER SENDUNGSCODE, 17.09.2026, UND WARUM ER IN DEN PFAD MUSS ═══
     Der Ort steht im Titel und das reicht fuer ihn, denn er beschreibt nur.
     Der Code beschreibt nicht, er FILTERT: klicks.mjs zaehlt einen Aufruf nur
     dann als Empfaengerklick, wenn sein Code in mail_results.jsonl als
     gesendet steht. Am 16.09. gehoerten 7 von 8 Pfaden im Zaehler uns selbst;
     wer sie mitzaehlt, meldet 25 % statt 4,2 %.
     Bei den KNOEPFEN gab es diesen Filter bis heute nicht, weil kein Code
     mitging. Folge, gemessen am 17.09.: der einzige gezaehlte Knopfdruck war
     ein eigener Test, und in jeder Lagemeldung stand "Knopfquote 100 %".
     In den Titel kann er nicht: GoatCounter haelt je Pfad genau EINEN Titel,
     also wuerde der zweite Druecker den ersten ueberschreiben. Im Pfad
     bekommt jede Sendung ihre eigene Zeile, und klicks.mjs summiert sie.
     Ohne Code bleibt der Pfad wie bisher `knopf/<name>`, und genau der zaehlt
     dann NICHT mit: ein Besucher ohne Sendung ist keiner unserer Empfaenger. */
  function code() {
    try {
      var p = new URLSearchParams(location.search).get('k');
      if (p && /^[a-z]{4}([a-z]{3})?$/i.test(p)) return p.toLowerCase();
      var s = sessionStorage.getItem('lr_code') || '';
      return /^[a-z]{4}([a-z]{3})?$/.test(s) ? s : '';
    } catch (e) { return ''; }
  }

  function melden(name) {
    var o = ort();
    var c = code();
    var u = ZIEL
      + '?e=true'
      + '&p=' + encodeURIComponent('knopf/' + name + (c ? '/' + c : ''))
      + '&t=' + encodeURIComponent('Knopf ' + name + (o ? ' / ' + o : ''))
      + '&r=' + encodeURIComponent(location.pathname + location.search)
      + '&rnd=' + String(Math.random()).slice(2);
    try {
      if (window.fetch) { fetch(u, { mode: 'no-cors', keepalive: true, cache: 'no-store' }); return; }
    } catch (e) { /* faellt auf das Bild zurueck */ }
    try { new Image().src = u; } catch (e) { /* dann eben nicht */ }
  }

  /* Eine Delegation am Dokument statt eines Hoerers je Knopf: ein spaeter
     eingefuegter Knopf wird mitgezaehlt, ohne dass hier etwas zu aendern ist. */
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[data-zaehl]') : null;
    if (!a) return;
    melden(a.getAttribute('data-zaehl'));
  }, true);

  /* Fuer den Selbsttest der Probe von aussen greifbar, sonst ungenutzt. */
  window.lrZaehl = melden;
})();
