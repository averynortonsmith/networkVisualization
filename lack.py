#!/usr/bin/python3

import sys
import inspect
import ast

# command format: ./lack.py [script].py [function] [args...]
# [script].py : script containing function being called
# [function]  : function being called
# [args...]   : function arguments (see README)
def runScript():
    assert len(sys.argv) >= 3

    scriptName = sys.argv[1]
    script = __import__(scriptName.strip(".py"))
    
    functionName = sys.argv[2]
    function = getattr(script, functionName)
    
    commandLineArgs = sys.argv[3:]
    # combine left and right values for keyword arg
    # example: 'foo' '=123' becomes 'foo=123'
    processedArgs = normalizeEquals(commandLineArgs)

    keywordArgs = {}
    # piped data becomes initial arg
    argValues = getPipedData()

    params, _, _, defaultValues = inspect.getargspec(function)
    if defaultValues:
        # names of params with default values
        defaults = params[-len(defaultValues):]
    else:
        defaults = []

    for arg in processedArgs:
        if isKeywordArg(arg):
            # arg has the form "name=value"
            # only split at the first '=' character
            name, value = arg.split("=", 1)
            keywordArgs[name] = tryEval(value)

        elif isFlagArg(arg):
            # arg has the form "--flag"
            flag = arg[2:]
            keywordArgs[flag] = True

        else:
            argValues.append(tryEval(arg))

    result = function(*argValues, **keywordArgs)
    if result != None:
        output = repr(result) if not isinstance(result, str) else result
        print(output)

# combine tokens for keyword arguments into a single token:
# 'foo', '=', '123'
# 'foo=', '123'
# 'foo', '=123'
# all become 'foo=123'
def normalizeEquals(args):
    if len(args) >= 3 and args[1] == "=":
        return ["".join(args[:3])] + normalizeEquals(args[3:])

    if len(args) >= 2 and (args[0][-1] == "=" or args[1][0] == "="):
        return ["".join(args[:2])] + normalizeEquals(args[2:])

    if args:
        return [args[0]] + normalizeEquals(args[1:])

    return []
    
# arg has the form "name=value"
def isKeywordArg(string):
    for char in string:
        if char in {"\"", "'"}:
            return False
        if char == "=":
            return True
    return False

# arg has the form "--flag"
def isFlagArg(string):
    return len(string) > 2 and string[:2] == "--"

# if argument is a filename, load and parse file text as a python expession
# otherwise, just parse argument string as a python expession
def tryEval(string):
    try:
        contents = open(string).read()
        return ast.literal_eval(contents)
    except (FileNotFoundError, SyntaxError):
        return ast.literal_eval(string)       


# if there's piped data, set as first argument in args list
def getPipedData():
    if not sys.stdin.isatty():
        pipedText = sys.stdin.read()
        try:
            return [ast.literal_eval(pipedText)]
        except SyntaxError:
            return [pipedText]
    else:
        return []

if __name__ == '__main__':
    runScript()
