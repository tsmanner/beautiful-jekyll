let IdAttrParser = new DnD.Parsers.Sequence(/([a-zA-Z_][\w\.]*)?/, /:/, /([a-zA-Z_]\w*)?/);

let ValueSourceParser = new DnD.Parsers.Sequence(
  IdAttrParser,
  new DnD.Parsers.Repeat(1, 2,
    new DnD.Parsers.Sequence(/ /, IdAttrParser),
  ),
);

let VSParser = new DnD.Parsers.SepBy(/ /, IdAttrParser);

// DnD.Values = {

//   initValue: function(element) {
//     if ("source" in element.dataset) {

//     }
//   },

//   initValues: function() {
//     Array.from(document.getElementsByClassName("value")).map(initValue);
//   },

// }
