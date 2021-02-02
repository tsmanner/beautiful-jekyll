DnD.Parsers = {}


DnD.Parsers.Parser = class {
  constructor() {}

  parse(inString) {
    return {
      remainder: inString
    }
  }

}


DnD.Parsers.AttributeReference = class extends DnD.Parsers.Parser {
  constructor() { super(); }

  parse(attributeReferenceString) {
    let match = attributeReferenceString.match(/^(?<id>[\w\.]*):(?<attribute>[\w\.]*)/);
    if (match) {
      return {
        id: match.groups.id,
        attribute: match.groups.attribute,
        ...super.parse(attributeReferenceString.slice(match[0].length))
      }
    }
    return {
      id: "",
      attribute: "",
      ...super.parse(attributeReferenceString)
    }
  }

}
