/**
* ASMWrangler
* Coldfire and S08 Assembly Tools for PSPad
*
* Pyramid Technologies
* Cory Todd
*
* Copyright (C) 2015 Pyramid Technologies
*
* This software may be modified and distributed under the terms
* of the MIT license. See the LICENSE file for details.
*/

var module_name = "ASMWrangler";
var module_title = "ASMWrangler";
var module_ver = "0.2";


/**
 * Function: Init
 * Purpose: Called on PSPad launch. This builds up the script menu entry for this extension
 *
 * @return: void
 */
function Init()
{
  addMenuItem("Goto definition", "ASM Wrangler", "findDefinition", "CTRL+ALT+B");
  addMenuItem("Find References", "ASM Wrangler", "findReferences", "CTRL+ALT+N");
  // Menu divider
  addMenuItem("-","ASM Wrangler","","");


  addMenuItem("Edit this script", "ASM Wrangler", "openScript");
  addMenuItem("About", "ASM Wrangler", "about");
}



/**
 * Function: openScript
 * Purpose: Shortcut function to open and edit this script
 *
 * @return: void
 */
function openScript()
{
  var editor = newEditor();
  editor.openFile(moduleFileName("ASMWrangler"));
}



/**
* Function: findRegex
* Purpose: Find and retrn all casinsensitive regex
* matches for the specified editor.
*
* @param: fs ActiveX object Scripting.FileSystemObject
* @param: filename string - OS filename
* @param: restr regex match string
*
* @return: array of matching strings
*/
function findRegex(fs, filename, restr)
{
  var matches = new Array();
  var r, re, line;
  var i = 0;
  var fileReader;
  var filename_maxlen = 60;
  var filename_str;


  if(filename.length > filename_maxlen)
  {
    filename_str = '...{0}'.format(
      filename.substr(
        filename.length-filename_maxlen,
	filename_maxlen)
      );
  }
  else
  {
    filename_str = filename;
  }


  re = new RegExp(restr, 'i');
  fileReader = fs.GetFile(filename).OpenAsTextStream(1, 0);


  while (!fileReader.AtEndOfStream)
  {
    line = fileReader.ReadLine();
    i++;
    r = line.search(re);

    if (r != -1)
    {
      matches.push("{0}({1}):: {2}\n".format(filename_str, i, line.substr(r)));
    }

  }

  fileReader.Close();
  return matches;
}



/**
 * Function: findInAllFiles
 * Purpose: Search all files in project for the specified regex string. All
 *
 * @param: editor       PSPad editor object
 * @param: restr        regex string
 *
 * @return: array of matching strings
 */
function findInAllFiles(editor, restr)
{
  var fs = new ActiveXObject("Scripting.FileSystemObject");
  var matches = new Array();
  var fr;
  var i = 0;
  var r, len;

  while(i < editorsCount())
  {
    editor.assignEditorByIndex(i);
    fr = editor.fileName();

    if (fs.FileExists(fr))
    {
      r = findRegex(fs, fr, restr)
      len = r.length;

      for(var x=0; x<len; x++)
      {
      	matches.push(r[x]);
      }
    }

    i++;
  }

  return matches;
}



/**
 * Function: runColdfireLinter
 * Purpose: Run a variety of linting checks to ensure code is safe. All results
 *  (violations, etc.) will be printed to the PSPad log window.
 */
function runColdfireLinter()
{
  var data;
  data = lint_jsr();

  // clears logger
  print([], true);

  var result = print(data, true);
}


/**
 * Function: lint_jsr
 * Purpose: Search all files for unsafe jsrs. An unsafe JSR/JMP is occurs when
 *  a long addressed program counter command is executed without explicitly
 *  declaring the target as a long address. In some situations, failure to do
 *  so will lead to execution of invalid memory.
 *
 * @return: string of violations separated by newline
 */
function lint_jsr()
{
  var editor = newEditor();
  editor.assignActiveEditor();


  restr = "(jsr|jmp)[\\s][a-bA-Z0-9]+[\\s]"
  return findInAllFiles(editor, restr);
}


/**
 * Function: findDefinition
 * Purpose: Search all editors for the currently seleted string as a definition
 *   of a RAM variable, labled function, or labeled array. The first matching
 *   result will be navigated to and any additional matches will be shown in
 *   the PSPad logging window.
 *
 * @return: void
 */
function findDefinition()
{
  var editor = newEditor();
  editor.assignActiveEditor();
  var restr = editor.selText();
  if(!restr)
    return;


  var ram;
  var aram;
  var proper;
  var actual;

  var strLen = restr.length;

  // RAM equates specific
  if(restr.charAt(0) == 'a')
  {
    aram = restr;
    ram = aram.substring(1);
  }
  else
  {
    aram = "a{0}".format(restr);
    ram = restr;
  }

  // Function label specific
  if(restr.charAt(strLen-1) == ':')
  {
    proper = restr;
    actual = aram.substring(0,strLen-1);
  }
  else
  {
    proper = "{0}:".format(restr,":");
    actual = restr;
  }


  restr = "(^(({0})|({1}))[\\s]equ)|(^(({2})|({3}))\\b)".format(aram, ram, proper, actual);
  var data = findInAllFiles(editor, restr);

  var result = print(data, true);
  showResult(result);
}


/**
 * Function: findReferences
 * Purpose: Search all editors for references to the the currently seleted
 *   label or variable. The distinction is made by looking at the content of the
 *   string. Any branching commands indicate the string is a label. Otherwise,
 *   the string must be a variable of some type. Matches will be shown in
 *   the PSPad logging window.
 *
 * @return: void
 */
function findReferences()
{
  var editor = newEditor();
  editor.assignActiveEditor();

  var restr = editor.selText();
  if(!restr || restr.length == 0)
    return;

  var entireLine = editor.lineText();
  if(!entireLine || entireLine.length == 0)
    return;


  // check is this is some sort of program control instruction
  re = new RegExp(G_OPCODE_RE.format(G_PROGRAM_CONTROL_RE), 'i');
  r = entireLine.search(re);

  var results;

  // If true, we have a match. That means we can a program control instruction
  if (r != -1)
  {
    // Find all references to selected text as a label reference
    opcode = G_OPCODE_RE.format(G_PROGRAM_CONTROL_RE);
    matchstr = "{0}[\\.blw]?\\b".format(restr);
    findMe = "{0}\\s{1}".format(opcode, matchstr)

    results = findInAllFiles(editor, findMe);



  }
  else
  {
    // RAM equates specific
    if(restr.charAt(0) == 'a')
    {
      aram = restr;
      ram = aram.substring(1);
    }
    else
    {
      aram = "a{0}".format(restr);
      ram = restr;
    }

    // The variable as either equ or RAM pointer
    targetStr = "((({0})|({1}))([\s]equ)?)".format(aram, ram);

    var patterns = new Array();

    // Otherwise, find all references to text as a variable
    patterns.push(G_OPCODE_SZ_RE.format(G_PROGRAM_CONTROL_RE));
    patterns.push(G_OPCODE_SZ_RE.format(G_DATA_MOVEMENT_RE));
    patterns.push(G_OPCODE_SZ_RE.format(G_ARITHMETIC_RE));
    patterns.push(G_OPCODE_SZ_RE.format(G_FLOATING_POINT_RE));
    patterns.push(G_OPCODE_SZ_RE.format(G_LOGICAL_RE));
    patterns.push(G_OPCODE_SZ_RE.format(G_BITWISE_RE));

    bigPattern = patterns.join("|")

    findMe = "({0})\\s{1}".format(bigPattern, targetStr);

    results = findInAllFiles(editor, findMe);
  }


  if(!results || results.length == 0)
    results = ["No results found for {0}".format(restr)];
  else
    results.splice(0, 0, ["Found {0} results for {1}:".format(results.length, restr)]);
  print(results, true);

}


/**
 * Function: print
 * Purpose: Render results to log window.
 *
 * @param: array of string data
 * @return: details object of shape {psFileName: string, psLineNum: int}
 */
function print(data, clearLog)
{
  var line = "";

  var splits;
  var lineNum = -1;
  var fileName = "";

  // Clear PSPad log window
  if(clearLog)
  	logClear();


  for (var i =0; i<data.length; i++)
  {
    line = "{0}".format(data[i]);

    if(line)
    {
      // Get the filename(lineNum) portion
      splits = line.split("::");
      if(splits.length >= 2)
      {

        fileName = splits[0].substring(0, splits[0].indexOf("("));
        lineNum = splits[0].substring(splits[0].indexOf("(")+1, splits[0].lastIndexOf(")"));

        // Log click-to-navigate seems to require only 1 ":"
        line = line.replace("::", ":");
      }

    }

    line += "\n";

    logAddLine(line);
  }


  var details = new Object();
  details.psfilename = fileName;
  details.pslinenum = lineNum;

  return details;

}



/**
 * Function: showResult
 * Purpose: Open new vertical split and navigate to result line number.
 *
 * @param: details object of shape {psFileName: string, psLineNum: int}
 * @return: void
 */
function showResult(details) {

  // no line number, don't bother showing details
  if(details.pslinenum == -1)
    return;

  // no file name, don't bother showing details
  if(!details.psfilename)
    return;

  // See if result is in a different file
  var editor = newEditor();
  editor.assignActiveEditor();
  var fr = editor.fileName();

  // We are already in the correct file
  if(fr == details.psfilename)
  {

    // Create a split window and make it active
    // 1st set horizontal (in case we're already vertical, this clears vertical split)
    // then really set vertical. Without this, we jump to the next window.
    runPSPadAction("aWindSplitHoriz");
    runPSPadAction("aWindSplitVert");
    runPSPadAction("aSelectNext") // Set the selected line in the split window to our match
    editor = newEditor();
    editor.assignActiveEditor();

  }
  else
  {
    editor = newEditor();
    editor.assignEditorByName(details.psfilename);
    editor.activate();
  }

  // Try ~center the content but I think there
  // is a bug in this implementation.
  editor.caretY(details.pslinenum);

  return;
}

/**
 * Function: about
 * Purpose: Show about dialogue for this extension
 * @return: void
 */
function about()
{
  echo( "\n" + module_name + " " + module_ver + "\n\n" +
	"RAM Variables: lookup the selected variable by equate. The result will open" +
	"in a new, veritcal split window. If you area already in vertical split mode, " +
	"the right split will be refocused on result line (if any)." +
	"Functions: lookup the selected function by label. The label must start at the " +
	"beginning of a line to be considered a function. Note that this includes labels " +
	"as well. This will also attempt to proper asm functions that are suffixed with the " +
	": symbol. The result will open in a new, veritcal split window just like RAM Vars." +
	"\n" +
	"Pro Tip: Set your compiler logger to use ;Clipper in order to auto-jump to line " +
	"numbers from the inbuilt log window"
	);
  return;
}









/* Prototypes */
if (!String.prototype.format)
{
  String.prototype.format = function()
  {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number)
    {
      return typeof args[number] != 'undefined' ? args[number] : match;
    }
    );
  };
}


var G_OPCODE_RE = '\\b{0}\\b';
var G_OPCODE_SZ_RE = '\\b{0}(\\.[bwl])?\\b';
var G_PROGRAM_CONTROL_RE = '((FBcc)|(BRA)|(BSR)|(JMP)|(JSR)|([BS])((CC)|(HS)|(CS)|(LO)|(EQ)|(GE)|(GT)|(HI)|(LE)|(LS)|(LT)|(MI)|(NE)|(PL)|(VC)|(VS)))';
var G_DATA_MOVEMENT_RE = '((PEA)|(LEA)|(UNLK)|(LINK)|(MVS)|(MVZ)|(MOV(3Q)|(E)|(A)|(M)|(CLR))|(F(DMOVE)|(MOVE)|(SMOVE)))';
var G_ARITHMETIC_RE = '(((ADD)|(SUB))((A)|(I)|(Q)|(X))?)|(CLR)|(CMP((A)|(I))?)|(DIV[SU])|(EXT(B)?)|(MUL[SU])|(NEG(X)?)|(M((AAC)|(AC)|(ASAC)|(SAAC)|(SAC)|(SSAC)))';
var G_FLOATING_POINT_RE = '((FCMP)|(FINT(RZ)?|F[SD]?)|((ADD)|(DIV)|(MUL)|(SUB)|(ABS)|(NEG)|(SQRT)))';
var G_LOGICAL_RE = '((AND(I)?)|((E)?OR(I)?)|(NOT)|([AL]{1}((SL)|(SR)))|(SWAP))';
var G_BITWISE_RE = '((B((CHG)|(CLR)|(TST)|(SET)))|(FF1)|(BITREV)|(BYTEREV))';
var G_SYS_CTRL_RE = '((FRESTORE)|(FSAVE)|(HALT)|(MOVEC)|(RTE))';
