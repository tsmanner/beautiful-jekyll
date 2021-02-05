DnD.Actions = {

  prompt: function(element) {

  },

  roll: function(element) {

  },

  initAction: function(element) {
    let eventWithKeys = DnD.Parsers.extractEventWithKeys(DnD.Parsers.EventWithKeys.parse(element.dataset.actions));
    console.log(eventWithKeys);
  },

  initActions: function() { Array.from(document.getElementsByClassName("action")).map(DnD.Actions.initAction); },

}
