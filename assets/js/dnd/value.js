DnD.Parsers.ElementId = /[a-zA-Z_][\w\.]*/;
DnD.Parsers.AttributeName = /[a-zA-Z_]\w*/;
DnD.Parsers.IdAttr  = new DnD.Parsers.Sequence(new DnD.Parsers.Optional(Dnd.Parsers.ElementId), /:/, new DnD.Parsers.Optional(DnD.Parsers.AttributeName));
DnD.Parsers.IdAttrs = new DnD.Parsers.SepBy(/ /, DnD.Parsers.IdAttr);


DnD.Value = {

  initValueReference: function(element) {
    if ("valueSource" in element.dataset) {
      let ast = DnD.Parsers.IdAttr.parse(element.dataset.valueSource);
      console.log(ast);
      if (ast.status == "ok") {
        if (ast.length == element.dataset.valueSource.length) {
          let sourceId = ast.children[0].children[0];
          let sourceAttr = ast.children[2].children[0];
          console.log(sourceId, sourceAttr);
          element.innerHTML = document.getElementById(sourceId).dataset[sourceAttr];
        }
        else {
          throw "Multiple element.dataset.sources '"+element.dataset.valueSource+"'";
        }
      }
      else {
        throw "Invalid element.dataset.valueSource '"+element.dataset.valueSource+"'";
      }
    }
  },

  initValueReferences: function() { Array.from(document.getElementsByClassName("value-reference")).map(DnD.Value.initValueReference); },

}


document.addEventListener('DOMContentLoaded', DnD.Value.initValueReferences);
