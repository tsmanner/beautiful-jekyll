//
// Parsers are constructed from a list of matchers
// Matchers are either a regex or a Parser
// Effectively, the regexes act as the lexer, and the Parsers compose those tokens into more complex grammars
// Parser.parse yields a ParseResult which has a list representing the current Parser's child tokens, a status, and a length
//


DnD.Parsers = {}


DnD.Parsers.Result = class {
  constructor(matcher, children, length, status) {
    this.matcher = matcher;
    this.children = children;
    this.length = length,
    this.status = status;
  }
}


DnD.Parsers.Parser = class {
  constructor() {}

  match(matcher, s) {
    if (matcher instanceof RegExp) {
      let match = s.match(matcher);
      if (match) {
        return {
          result: new DnD.Parsers.Result(matcher, [match[0]], match[0].length, "ok"),
          s: s.slice(match[0].length),
        };
      }
      else {
        return {
          result: new DnD.Parsers.Result(matcher, [], 0, "NoMatch("+matcher.source+")"),
          s: s,
        };
      }
    }
    else if (matcher instanceof DnD.Parsers.Parser) {
      let result = matcher.parse(s);
      if (result.status == "ok") {
        return {
          result: new DnD.Parsers.Result(matcher, result.children, result.length, "ok"),
          s: s.slice(result.length),
        };
      }
      else {
        return {
          result: new DnD.Parsers.Result(matcher, [], 0, result.status),
          s: s,
        };
      }
    }
    else {
      throw "Unrecognized Matcher " + matcher + "!";
    }
  }

}


//
// Sequence Parser
//   Takes a list of matchers, requiring that they all match, in order
//
DnD.Parsers.Sequence = class extends DnD.Parsers.Parser {
  constructor(...matchers) {
    super();
    // Force all matcher RegExps to match starting from the beginning of input
    this.matchers = matchers.map(function (matcher) {
      if (matcher instanceof RegExp && !matcher.source.startsWith("^")) {
        return RegExp("^" + matcher.source);
      }
      return matcher;
    });
  }

  parse(inString) {
    let s = inString;
    let results = [];
    for (const idx in this.matchers) {
      const result = super.match(this.matchers[idx], s);
      results.push(result.result);
      s = result.s;
    }
    let fails = results.reduce(function(statuses, result) { if (result.status != "ok") { statuses.push(result.status); } return statuses; }, []);
    if (fails.length == 0) {
      let length = results.reduce(function(sum, result) { return sum + parseInt(result.length); }, 0);
      return new DnD.Parsers.Result(this, results, length, "ok");
    }
    else {
      return new DnD.Parsers.Result(this, [], 0, fails.join(", "));
    }
  }
}


let IdAttrParser = new DnD.Parsers.Sequence(/([a-zA-Z_][\w\.]*)?/, /:/, /([a-zA-Z_]\w*)?/);
