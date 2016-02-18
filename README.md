# pspad-asmwrangler
PSPad Extension for Coldfire and S08 Asssmbler dialect

## All hail PSPad

In order to use this extension, you will obviously need PSPad. [Get PSPad](http://www.pspad.com/). Once you install PSPad, be sure
to enable scripting which is under settings->system integration.

## Why this extension?

Assembly is not known for being IDE friendly. There are a small number of assembly IDEs that target traditional CPUs but I've yet to find a decent MCU assembler IDE. PSPad is a fantastic base so ASMWrangler aims to add IDE features like definition lookps and linting to your PSPad project.

### Definition Lookup
*  Lookup any equate or label
*  Results listed in your PSPad log window in ";Clipper" format
*  1st result is opened in a vertical split window or new window if found in another file


### JSR Linter (Coldfire)
Coldfire has this nasty pitfall that compiles without warning. I you JSR to an offset that is more than a WORD width away, you will branch into oblivion. The fix is to suffic your JSR taget with a .l (long) specifier. I suppose this is the downside to handwritting assembly :)
* Any vioaltions will be listed in your PSPad log window
