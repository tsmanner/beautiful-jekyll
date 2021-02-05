DnD.Value = {

  getValue: function(element) {
    if ("value" in element.dataset) {
      let parseResult = DnD.Parsers.ValueOrIdAttr.parse(element.dataset.value);
      if (parseResult.status == "ok") {
        if (parseResult.children[0].matcher instanceof RegExp) {
          return parseInt(parseResult.children[0].children[0]);
        }
        else {
          let source = DnD.extractIdAttr(parseResult.children[0]);
          if (source.id == null) { source.id = element.id; }
          if (source.attr == null) { source.attr = "value"; }
          return parseInt(document.getElementById(source.id).dataset[source.attr]);
        }
      }
    }
  },

  renderValue: function(element) {
    element.innerHTML = DnD.Value.getValue(element);
  },

  renderModifier: function(element) {
    let value = DnD.Value.getValue(element);
    if (value >= 0) { element.innerHTML = "+" + value; }
    else { element.innerHTML = value; }
  },

  renderValues: function() { Array.from(document.getElementsByClassName("value")).map(DnD.Value.renderValue); },
  renderModifiers: function() { Array.from(document.getElementsByClassName("modifier")).map(DnD.Value.renderModifier); },

}


DnD.initFunctions.push(DnD.Value.renderValues);
DnD.initFunctions.push(DnD.Value.renderModifiers);
