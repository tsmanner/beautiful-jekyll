DnD.Parsers.ElementId = /[a-zA-Z_][\w\.]*/;
DnD.Parsers.AttributeName = /[a-zA-Z_]\w*/;
DnD.Parsers.IdAttr  = new DnD.Parsers.Sequence(new DnD.Parsers.Optional(DnD.Parsers.ElementId), /:/, new DnD.Parsers.Optional(DnD.Parsers.AttributeName));
DnD.Parsers.IdAttrs = new DnD.Parsers.SepBy(/ /, DnD.Parsers.IdAttr);
DnD.extractIdAttr = function(ast) {
  if (ast.status == "ok") {
    let idOptional = ast.children[0].children;
    let id = ("children" in idOptional && idOptional.children.length == 1) ? idOptional.children[0] : null;
    let attrOptional = ast.children[2].children;
    let attr = ("children" in attrOptional && attrOptional.children.length == 1) ? attrOptional.children[0] : null;
    console.log(id, attr);
    return { id: id, attr: attr, };
  }
  else {
    throw "Invalid IdAttr '"+inString+"'";
  }
}
DnD.extractIdAttrs = function(ast) {
  return ast.children.map(DnD.extractIdAttr);
}


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


document.addEventListener('DOMContentLoaded', DnD.Value.initValueReferences);
