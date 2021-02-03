//
// Parsers are constructed from a list of matchers
// Matchers are either a regex or a Parser
// Effectively, the regexes act as the lexer, and the Parsers compose those tokens into more complex grammars
// Parser.parse yields a ParseResult which has a list representing the current Parser's child tokens, a status, and a length
//


DnD.Parsers = {}


DnD.Parsers.Result = class {
  constructor(matcher, tokens, length, status="ok") {
    this.matcher = matcher;
    this.tokens = tokens;
    this.length = length,
    this.status = status;
  }
}


DnD.Parsers.Parser = class { constructor() {} }


//
// Sequence Parser
//   Takes a list of matchers, requiring that they all match, in order
//
DnD.Parsers.Sequence = class extends DnD.Parsers.Parser {
  constructor(...matchers) { super(); this.matchers = matchers; }

  parse(inString) {
    let s = inString;
    let results = [];
    for (const idx in this.matchers) {
      const matcher = this.matchers[idx];
      if (matcher instanceof RegExp) {
        let match = s.match(matcher);
        if (match) {
          results.push(new DnD.Parsers.Result(matcher, [match[0]], match[0].length));
          s = s.slice(result.length);
        }
        else {
          results.push(new DnD.Parsers.Result(matcher, [], 0, "NoMatch"));
        }
      }
      else if (matcher instanceof DnD.Parsers.Parser) {
        let result = matcher.parse(s);
        if (result.status == "ok") {
          results.push(new DnD.Parsers.Result(matcher, result.tokens, result.length, "ok"));
          s = s.slice(result.length);
        }
        else {
          results.push(new DnD.Parsers.Result(matcher, [], 0, result.status));
        }
      }
      else {
        throw "Unrecognized Matcher " + matcher + "!";
      }
    }
    let length = results.reduce(function(sum, result) { return sum + parseInt(result.length); }, 0);
    let fails = results.reduce(function(statuses, result) { return statuses + ((result.status != "ok") ? ", " + result.status : ""); }, "");
    let status = (fails == "") ? "ok" : fails;
    return new DnD.Parsers.Result(this, results, length, status);
  }
}

