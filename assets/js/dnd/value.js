DnD.Parsers.IdAttr  = new DnD.Parsers.Sequence(/([a-zA-Z_][\w\.]*)?/, /:/, /([a-zA-Z_]\w*)?/);
DnD.Parsers.IdAttrs = new DnD.Parsers.SepBy(/ /, DnD.Parsers.IdAttr);


DnD.Value = {

  initValue: function(element) {
    if ("source" in element.dataset) {
      let ast = DnD.Parsers.IdAttr.parse(element.dataset.source);
      console.log(ast);
      if (ast.status == "ok") {
        if (ast.length == element.dataset.source.length) {
          let sourceId = ast.children[0].children[0];
          let sourceAttr = ast.children[0].children[2];
          console.log(sourceId, sourceAttr);
          element.innerHTML = document.getElementById(sourceId).dataset[sourceAttr];
        }
        else {
          throw "Multiple element.dataset.sources '"+element.dataset.source+"'";
        }
      }
      else {
        throw "Invalid element.dataset.source '"+element.dataset.source+"'";
      }
    }
  },

  initValues: function() {
    Array.from(document.getElementsByClassName("value")).map(DnD.Value.initValue);
  },

}


document.addEventListener('DOMContentLoaded', DnD.Value.initValues);
