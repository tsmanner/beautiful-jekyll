var DnD = {
  initFunctions: [],
  initDnD: function() {
    DnD.initFunctions.map(function(f) { f(); });
  }
};


document.addEventListener('DOMContentLoaded', DnD.initDnD);
