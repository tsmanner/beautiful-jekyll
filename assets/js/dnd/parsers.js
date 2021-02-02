DnD.Parsers = {}


DnD.Parsers.Parser = class {
  constructor() {}
  parse(inString) {
    return {
      result: {},
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
      ...super.parse(parseString),
      result: {
        id: "",
        attribute: ""
      }
    }
  }
}


DnD.Parsers.Parenthetical = class extends DnD.Parsers.Parser {
  constructor(innerParser) { super(); this.innerParser = innerParser; }
  parse(parseString) {
    let match = parseString.match(/^\(/);
    if (match) {
      parseResult = this.innerParser.parse(parseString.slice(match[0].length));
      if (parseResult && parseResult.remainder.match(/^\)/)) {
        return {
          result: parseResult.result,
          remainder: result.remainder
        }
      }
    }
    return super.parse(parseString);
  }
}
