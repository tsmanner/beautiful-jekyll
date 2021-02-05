DnD.Value = {

  initValue: function(element) {
    if ("value" in element.dataset) {
      let parseResult = DnD.Parsers.ValueOrIdAttr.parse(element.dataset.value);
      if (parseResult.status == "ok") {
        if (parseResult.children[0].matcher instanceof RegExp) {
          element.innerHTML = parseResult.children[0].children[0];
        }
        else {
          let source = DnD.extractIdAttr(parseResult.children[0]);
          if (source.id == null) { source.id = element.id; }
          if (source.attr == null) { source.attr = "value"; }
          element.innerHTML = document.getElementById(source.id).dataset[source.attr];
        }
      }
    }
  },

  initValues: function() { Array.from(document.getElementsByClassName("value")).map(DnD.Value.initValue); },

}


DnD.initFunctions.push(DnD.Value.initValues);
