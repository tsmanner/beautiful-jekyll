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
  parse(parseString) {
    let match = parseString.match(/^(?<id>[\w\.]*):(?<attribute>[\w\.]*)/);
    if (match) {
      return {
        id: match.groups.id,
        attribute: match.groups.attribute,
        ...super.parse(parseString.slice(match[0].length))
      }
    }
    return {
      id: "",
      attribute: "",
      ...super.parse(parseString)
    }
  }
}


DnD.Parsers.Parenthetical = class extends DnD.Parsers.Parser {
  constructor(innerParser) { super(); this.innerParser = innerParser; }
  parse(parseString) {
    let match = parseString.match(/^\(/);
    if (match) {
      result = this.innerParser.parse(parseString.slice(match[0].length));
      if (result.remainder.match(/^\)/)) {
        return {
          ...result,
          remainder: result.remainder
        }
      }
    }
    return super.parse(parseString);
  }
}
