!function (x) { function w() { var v, u, t, tes, s = x.document, r = s.documentElement, a = r.getBoundingClientRect().width; if (!v && !u) { var n = !!x.navigator.appVersion.match(/AppleWebKit.*Mobile.*/); v = x.devicePixelRatio; tes = x.devicePixelRatio; v = n ? v : 1, u = 1 / v } if (a > 768) { r.style.fontSize = "48px" } else { if (a <= 320) { r.style.fontSize = "20px" } else { r.style.fontSize = a / 320 * 20 + "px" } } } x.addEventListener("resize", function () { w() }); w() }(window);
(function () {
  if (typeof WeixinJSBridge == "object" && typeof WeixinJSBridge.invoke == "function") {
    h();
  } else {
    document.addEventListener("WeixinJSBridgeReady", h, false);
  }
  function h() {
    WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize': 0 }); WeixinJSBridge.on('menu:setfont', function () {
      WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize': 0 });
    });
  }
})();