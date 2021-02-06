DnD.Actions = {

  prompt: function(element) {
    prompt("foobar");
  },

  reset: function(element) {
    console.log("Resetting", element);
    if (element.classList.contains("roll")) {
      delete element.dataset.rollResult;
      DnD.Value.renderRoll(element);
    }
  },

  roll: function(element) {
    // console.log("Rolling", element);
    let die = parseInt(DnD.Parsers.Roll.parse(element.dataset.roll)
      .children[0]  // Sequence(Optional(/\d+/), /d/, /(4|6|8|10|12|20|100)/)
      .children[2]  // /(4|6|8|10|12|20|100)/
      .children[0]  // die value
    );
    element.dataset.rollResult = DnD.Value.getValue(element) + Math.floor(Math.random() * die) + 1;
    DnD.Value.renderRoll(element);
  },

  initAction: function(element) {
    let eventListenerWrappers = {
      click: function (f) { return f; },
      auxclick: function (f) { return f; },
      dblclick: function (f) { return f; },
      contextmenu: function (f) { return function (event) { event.preventDefault(); f(event); }; },
    }
    let eventsWithKeys = DnD.Parsers.extractEventActions(DnD.Parsers.EventActions.parse(element.dataset.actions));
    for (const eventWithKeys of eventsWithKeys) {
      element.addEventListener(eventWithKeys.event, eventListenerWrappers[eventWithKeys.event](function(event) {
        if (Object.keys(eventWithKeys.keys).reduce(
          function(value, key) { return value && eventWithKeys.keys[key] == event[key]; },
          true)
        ) {
          DnD.Actions[eventWithKeys.action](element);
        }
      }));
    }
  },

  initActions: function() { Array.from(document.getElementsByClassName("action")).map(DnD.Actions.initAction); },

}

DnD.initFunctions.push(DnD.Actions.initActions);
