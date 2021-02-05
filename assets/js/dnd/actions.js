DnD.Actions = {

  prompt: function(element) {

  },

  roll: function(element) {

  },

  initAction: function(element) {
    let eventsWithKeys = DnD.Parsers.extractEventsWithKeys(DnD.Parsers.EventsWithKeys.parse(element.dataset.actions));
    console.log(eventsWithKeys);
    for (const eventWithKeys of eventsWithKeys) {
      let keys = eventWithKeys.keys.reduce(function (keys, key) { keys[key] = true; return keys; }, { alt: false, ctrl: false, shift: false });
      console.log(keys);
    }
  },

  initActions: function() { Array.from(document.getElementsByClassName("action")).map(DnD.Actions.initAction); },

}

DnD.initFunctions.push(DnD.Actions.initActions);
