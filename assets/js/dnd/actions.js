DnD.Actions = {

  prompt: function(element) {

  },

  roll: function(element) {

  },

  initAction: function(element) {

  },

  initActions: function() { Array.from(document.getElementsByClassName("action")).map(DnD.Actions.initAction); },

}
