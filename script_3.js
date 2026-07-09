
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js?v=app-mode-v1').catch(function(){});
  });
}
