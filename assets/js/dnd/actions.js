DnD.Actions = {

  prompt: function(element) {

  },

  roll: function(element) {

  },

  initAction: function(element) {
    let eventsWithKeys = DnD.Parsers.extractEventsWithKeys(DnD.Parsers.EventsWithKeys.parse(element.dataset.actions));
    console.log(eventsWithKeys);
  },

  initActions: function() { Array.from(document.getElementsByClassName("action")).map(DnD.Actions.initAction); },

}

DnD.initFunctions.push(DnD.Actions.initActions);
