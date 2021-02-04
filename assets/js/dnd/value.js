DnD.Value = {

  initValueReference: function(element) {
    if ("valueSource" in element.dataset) {
      let source = DnD.extractIdAttr(DnD.Parsers.IdAttr.parse(element.dataset.valueSource));
      if (source.id == null) { source.id = element.id; }
      if (source.attr == null) { source.attr = "value"; }
      element.innerHTML = document.getElementById(source.id).dataset[source.attr];
    }
  },

  initValueReferences: function() { Array.from(document.getElementsByClassName("value-reference")).map(DnD.Value.initValueReference); },

}


DnD.initFunctions.push(DnD.Value.initValueReferences);
