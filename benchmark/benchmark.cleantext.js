var text = `
    <g transform="translate(
        0,
        0)">

        <circle data-ref="outlineNode"
            r="0" 
            fill="white"
            class="ooooo xxxxx">
        </circle>
        
        <circle data-ref="collisionNode"
            r="$0"
            fill="red">
        </circle>

        <circle 
        
            data-ref="collisionNode"
            r="$0"
            fill="
                red
            "
            stroke=
            "hoho"
            
            >

        </circle>

    </g>
`
var text = `

        <tag   mixedCaseAttribute=" X "></tag>
        <tag   isolatedA="
                    text
                ">
        </tag>
        <tag   isolatedB="
                    text
                "
        >
        </tag>
        <tag   isolatedC="text
        ">
        </tag>
        <tag   isolatedD=
                "text">
        </tag>
        <tag   transformA="translate(
            0,
            0)">
        </tag>
        <tag   transformB="translate(
            0,
            0
        )">
        </tag>
 <tag multiple=""   attributes   someareempty="asd"></tag>
`
console.log(cleanInputString_old(text))
function cleanInputString_new(html) {
    html = html.replace(/xxx/g,"")
}
function cleanInputString_old(html) {
    
    // remove all newlines, tabs and returns from the html string to create one line
    // regex: [\n\t\r]
    // subst: null
    html = html.replace(/[\n\t\r]/g, "")

    // style multiline specific:
    // ------------------------------------------------------------------
    // remove all spaces > 2 
    // regex: \s{2,}
    // subst: null
    html = html.replace(/\s{2,}/g, " ")
    
    // add space after every ; in style attributes
    // regex: ;([^\s])
    // subst: ; $1
    html = html.replace(/;([^\s])/g, "; $1")
    
    // remove space before "> close combination
    // regex: \s(">)
    // subst: $1
    html = html.replace(/\s(">)/g, "$1")    
    // ------------------------------------------------------------------


    // remove all whitespace between tags but not inside of tags
    // regex: >\s*<
    // subst: ><
    html = html.replace(/>\s*</g, "><")

    // remove all whitespace before the first tag or after the last tag
    // regex: ^(\s*)|(\s*)$
    // subst: null
    html = html.replace(/^(\s*)|(\s*)$/g, "")

    // remove spaces before tagText nodes
    // regex: >\s*
    // subst: >
    html = html.replace(/>\s*/g, ">")
    
    // remove spaces after tagText nodes
    // regex: \s*<
    // subst: <
    html = html.replace(/\s*</g, "<")

    // remove space between opening tag and first attribute
    // regex: (<\w*)(\s{2,})
    // subst: $1\s
    html = html.replace(/(<\w+)(\s{2,})/g, "$1 ")

    // remove space between attributes (trailing space)
    // regex: ([\w-_]+="[\w\s-_]+")(\s*(?!>))
    // subst: $1\s
    html = html.replace(/([\w-_]+="[\w\s-_]+")(\s*(?!>))/g, "$1 ")

    // remove space between last attribute and closing tag
    // regex: (\w+="\w+")(\s+)>
    // subst: $1>
    html = html.replace(/([\w-_]+="[\w\s-_]+")(\s{2,})>/g, "$1>")
    

    // console.log("cleaned html string:", html)
    return html
}



/*

    PLAYGROUND-A (HTML)
    <tag></tag>
    <tag/>
    <tag><tag>
    </tag></tag>
    
    <tag>text</tag>
    <tag> text </tag>
    <tag>   text   text   </tag>
    <tag>
        text
        text
    </tag>

    <tag x></tag>
    <tag x=""></tag>
    <tag x="2"></tag>
    <tag x="2"   ></tag>
    <tag   x="2"></tag>
    
    <tag x="2"   y="1"></tag>

    <tag x
    =
    "
    2
    "
    ></tag>

    <tag transform="translate(1,2)"></tag>
    <tag transform="translate(1,2) translate(1,2)"></tag>
    <tag transform="translate(1,2) translate(1,2) translate(1,2)"></tag>

    <tag transform="translate(  1  ,  2  )
        translate (
            3,
            4
        )
        translate(        1px     ,       0px        )
        rotate(-0deg)
        scale(0.5, 0.5)"
        
        style="
                text-shadow: 1px 1px 2px black, 0 0 25px blue; color: rgba(200,
                300 ,  2,  .18 );
                text-shadow: 0 0 3px #FF0000, 0 0 5px #0000FF;
                background: url('img.gif
                ') right bottom no-repeat, url('img.gif') left top repeat;
                background: linear-gradient(to bottom,    #1e5799   0%,
                #2989d8 50%, #207cca  51%, #7db9e8 100%);"
    </tag>

*/


/*

    PLAYGROUND-B (ATTRIBUTE VALUES)

    translate(  1  ,  2  )
    translate (
    3, 
    4 
    )
    translate(        1px     ,       0px        )
    rotate(-0deg)
    scale(0.5, 0.5)
    text-shadow: 1px 1px 2px black, 0 0 25px blue; color: rgba(200,
    300 ,  2,  .18 )
    text-shadow: 0 0 3px #FF0000, 0 0 5px #0000FF;
    background: url('img.gif
    ') right bottom no-repeat, url('img.gif') left top repeat;
    background: linear-gradient(to bottom,    #1e5799   0%,
    #2989d8 50%, #207cca  51%, #7db9e8 100%)

*/



/*
    GENERAL QUESTIONS, PREPARATION

    #######################################################################################
    SHOULD I REPLACE TABS WITH SPACES?
    #######################################################################################
    + possible tab usage failure when the editor saves tabs instead of spaces:
    translate(
        \t100,
        \t100,
    )

    + create an 'Element' by 'DOMParser' - providing a string that contains \t - in the Browser Console.
    p.parseFromString(`<div transform="translate(   0,0)"></div>`, "text/html").body.firstChild.attributes

    + REGEX: text.replace(/[\n\t\v\r]/g, ` `)  

    TESTING TAB VS SPACE MATCH IN JS VIA BROWSER-CONSOLE:
    var tabstring = "\thi"
    undefined
    /\thi/.test(tabstring)
    true
    / *hi/.test(tabstring)
    true
    #######################################################################################


    #######################################################################################
    SHOULD I REPLACE `"` with `'` if inside of attribute?
    #######################################################################################
    => replace `"` with `'`
    + proof: 
    var p = new DOMParser()
    var falsy = p.parseFromString(`<div style="background: url("image.gif")"></div>`, "text/html")
    var correct = p.parseFromString(`<div style="background: url('image.gif')"></div>`, "text/html")
    console.log(falsy.body.firstChild.attributes)      
    // array: [ style="background: url(", image.gif")"="" ]
    console.log(correct.body.firstChild.attributes)    
    // array: [ style="background: url('image.gif')" ]
    #######################################################################################



    #######################################################################################
    SHOULD I NOT CAPTURE MORE THAN ONE SPACE OR LINEBREAKS INSIDE TEXT NODES?
    #######################################################################################
    DEFAULT REGEX: >\s*([^<]*?)\s*<
    PROBLEM: i need the lazy quantifier in the capturing group 
    to be able to remove trailing whitespace in one go.
    
    DEFAULT POSSESSIVE: >(?:[^<]|([^< ])(?!<))*<
    http://www.rexegg.com/regex-quantifiers.html#possessive
    #######################################################################################

*/


/*
    MATCH IDEA:
    (opening-of-opening-tag)|(attribute-with-leading-space)|(closing-of-opening-tag)|(closing-tag)|(text-nodes-inside-open-close)
    I don't want to validate. Here, at first, I do expect that the text is not wrong, but I want to take care of all whitespace,
    and get it in one line, for later steps.

    METHOD: $(:(S)something(T)i(U)not(F)capture(F))* | but still match

    REPLACE: All groups that exist: $1$2$3$4 

    METHOD TEST:
    reg: (abc)|(def)ghij|(klmn)opq
    text: abcdefghijklmnopq
    replace: $1$2$3
    result: abcdefklmn

    #######################################################################################
    ATTRIBUTE-VALUE-TOKENS
    #######################################################################################
    translate(0,0)
    translate(0px,0px)
    rotate(-0deg)
    transform: scale(0.5, 0.5)
    text-shadow: 1px 1px 2px black, 0 0 25px blue
    text-shadow: 0 0 3px #FF0000, 0 0 5px #0000FF
    background: url("img_flwr.gif") right bottom no-repeat, url("paper.gif") left top repeat
    background: linear-gradient(to bottom, #1e5799 0%,#2989d8 50%, #207cca 51%, #7db9e8 100%)
    #######################################################################################

    TOKENS:
    tag-names           : [\w\-\:]
    attribute-names     : [a-zA-Z\-]
    attribute-values    : [\w\:\;\#\=\,\.\-\(\)\_\%\']

    ALL-CASE-MATCHER:
    > can be atomic?
    (opening-of-opening-tag) + ()  

    (?:\s*+(<[\w\-\:]++))

    \s*?(?:(?<=\()\s++|\s++(?=[\(\)\,])|( ?[X]++))\s*?

    |   \s*(\/?>)
    |   >\s*(.*?)\s*<
    |   \s*(<\/[\w-]+>)\s*

    REDUCING STEPS FOR ATTRIBUTE-NAMES:
    ( )\s*+([a-zA-Z\-]++) requires much less steps than \s*( [a-zA-Z\-]++)
    
    LOOKS LIKE ALTERNATION FASTER THAN FEWER MATCHES: (revalidate)
    (?:\s*+(<[\w\-\:]++))|(?:( )\s*+([a-zA-Z\-]++)\s*(=)\s*(")\s*([^"]*?)\s*("))*?
        versus
    (?:\s*+(<[\w\-\:]++))(?:( )\s*+([a-zA-Z\-]++)\s*(=)\s*(")\s*([^"]*?)\s*("))*?    



    PROBLEMS WHEN COMBINING THE PATTERNS:
    -----------------------------------------------------------------------------------------------
    EXAMPLE:
    When i just match the attributes and values:
    (?:\s*( [a-zA-Z\-]++)(?:\s*(=)\s*(")(?:\s*([^"]*?)\s*)?("))?)*?
    i="hu"      x  y="yeah"
    i="hu"    y="yeah"  x   k    j="jo" 
    x x x x x x x x x x x x x x x x
    x    x    x    x    x 
    @SCREENSHOT:
    Everything will be matched properly, cause the groups will match multiple times.
    
    But if i just prefix the opening of opening tag or encloses them in an opening tag,
    all multiple matches from before will match to group 0 instead on their own.
    Means all is matched but only the last attribute subgroups will be mached once for the tag!
    \s*(<[\w\-\:]++)(?:\s*( [a-zA-Z\-]++)(?:\s*(=)\s*(")(?:\s*([^"]*?)\s*)?("))?)*?\s*(\/?>)
    <tag i="hu"      x  y="yeah" />
    <tag i="hu"    y="yeah"  x   k    j="jo" /> 
    <tag x x x x x x x x x x x x x x x x />
    <tag x    x    x    x    x /> 
    @SCREENSHOT:
    
    IDEA: instead of chaining the attributes after the tag start, 
    make an equasion, and add a positive lookbehind before the attribute names.
    
    [x] NEXT PROBLEM: CANT USE QUANTIFIERS IN LOOKAROUNDS!
    But it works without lookbehind aswell for the latter simple text:
    \s*(<[\w\-\:]++)|\s*( [a-zA-Z\-]++)(?:\s*(=)\s*(")(?:\s*([^"]*?)\s*)?("))?|\s*(\/?>)
    
    [x] NEXT PROBLEM: other stuff could be consumed by these groups!
    Testing this with extreme attributes and the needed match extension.
    NEW ATTRIBUTE-VALUE-MATCHER: (?:(")\s*?(?:(?<=\()\s+?|\s+?(?=[\(\)\,])|( ?[\w\:\;\#\=\,\.\-\(\)\_\%\']++))?\s*("))?    

    [x] NEXT PROBLEM: only one attribute value can get matched properly
    Trying to distinct between attribute value position: (single|start|end|mid)
    Only if single the attribute value must be optional.
    single  :(?:(")\s*?(?:(?<=\()\s+?|\s+?(?=[\(\)\,])|([\w\:\;\#\=\,\.\-\(\)\_\%\']++))?\s*("))?)?
    start   :(?:(")\s*?(?:(?<=\()\s+?|\s+?(?=[\(\)\,])|([\w\:\;\#\=\,\.\-\(\)\_\%\']++))\s*?)
    end     :(?:\s*?(?:(?<=\()\s+?|\s+?(?=[\(\)\,])|( ?[\w\:\;\#\=\,\.\-\(\)\_\%\']++))\s*("))
    mid     :(?:\s*?(?:(?<=\()\s+?|\s+?(?=[\(\)\,])|( ?[\w\:\;\#\=\,\.\-\(\)\_\%\']++))?\s*)
    
    IT ACTUALLY SEEMS TO WORK! BUT 10k steps ~10ms:
    REGEX: \s*(\<[\w\-\:]++)|\s*(\/?\>)|\s*(\ [a-zA-Z\-]++)\s*(=)\s*(?:(?:(\")\s*(?:(?<=\()\s++|\s++(?=[\(\)\,])|([\w\:\;\#\=\,\.\-\(\)\_\%\']++))?\s*(\"))?)?|(?:(")\s*(?:(?<=\()\s++|\s++(?=[\(\)\,])|([\w\:\;\#\=\,\.\-\(\)\_\%\']++)))|(?:\s*?(?:(?<=\()\s++|\s++(?=[\(\)\,])|(\ ?[\w\:\;\#\=\,\.\-\(\)\_\%\']++))\s*(\"))|(?:\s*?(?:(?<=\()\s++|\s++(?=[\(\)\,])|(\ ?[\w\:\;\#\=\,\.\-\(\)\_\%\']++)))
    TEXT: 
    <tag a b c d e f g>
    <tag id="1" class="yeah cool">
    <tag disabled  disabled=""/>
    <tag transform=
        "translate(1,2)"
    />
    <tag transform="
            translate(1,2)
    "/>
    <tag class="single"/>
    <tag class="start end"/>
    <tag class="start mid mid mid end"/>
    <tag points="00 11 22"/>
    <tag transform="translate(1,2)"/>
    <tag transform="translate( 1, 2)"/>
    <tag transform="translate  (  1, 2   )"/>
    <tag transform="translate(-12deg)"/>
    <tag transform="translate(1,2) translate(1,2)"/>
    <tag transform="
            translate(1,2)
            translate(1,2)
    "/>
    <tag transform="
            translate(1,2)
    "/>
    <tag transform="translate(   1,   
                2)"/>
    <tag transform="translate(  1  ,  2  )
                translate (
                            3, 
                            4 
                )
    translate(        1px     ,       0px        )
    rotate(-0deg)
    scale(0.5, 0.5)
    text-shadow: 1px 1px 2px black, 0 0 25px blue; color: rgba(200,
    300 ,  2,  .18 )
    text-shadow: 0 0 3px #FF0000, 0 0 5px #0000FF;
    background: url('img.gif
    ') right bottom no-repeat, url('img.gif') left top repeat;
    background: linear-gradient(to bottom,    #1e5799   0%,
    #2989d8 50%, #207cca  51%, #7db9e8 100%)"/>
 

    NOW FINISH BY ADDING CLOSING TAGS AND TEXT-NODES
    TEXT-NODES: (?<=>)(?<!\/>)([^<]*)?(?=<\/)
    CLOSING-TAGS: \s*(\<\/[\w\-\:]++\>)\s*

    PROBLEM: DOES NOT WORK FOR </tag>SHOULD NOT MATCH</tag>
    IGNORE???
    Kind of a solution but could cause trouble in matching attributes:
    \s*(\<[\w\-\:]++)[^>]*\s*(\>)(?<!\/\>)([^<]*)?(\<\/[\w\-\:]++\>)\s*|\s*(\<[\w\-\:]++)|\s*(\/?\>)|(\<\/[\w\-\:]++\>)\s*
    => must be placed to the end?

    TEMP-TEST-FOR FIRST BENCHMARK RESULTS, NOT BUGFREE:
    \s*(\<[\w\-\:]+)|\s*(\>)(?<!\/\>)([^<]*)?\s*(\<\/[\w\-\:]+\>)\s*|\s*(\/?\>)|\s*(\<\/[\w\-\:]+\>)\s*|\s*(\ [a-zA-Z\-]+)\s*(\=)\s*(?:(?:(\")\s*(?:(?<=\()\s+|\s+(?=[\(\)\,])|([\w\:\;\#\=\,\.\-\(\)\_\%\']+))?\s*(\"))?)?|(?:(\")\s*(?:(?<=\()\s+|\s+(?=[\(\)\,])|([\w\:\;\#\=\,\.\-\(\)\_\%\']+)))|(?:\s*?(?:(?<=\()\s+|\s+(?=[\(\)\,])|(\ ?[\w\:\;\#\=\,\.\-\(\)\_\%\']+))\s*(\"))|(?:\s*?(?:(?<=\()\s+|\s+(?=[\(\)\,])|(\ ?[\w\:\;\#\=\,\.\-\(\)\_\%\']+)))

    BEST ATTEMT TILL NOW:
    \s*(\<[\w\-\:]++)|\s*(\>)(?<!\/\>)([^<]*)?\s*(\<\/[\w\-\:]++\>)\s*|\s*(\/?\>)|\s*(\<\/[\w\-\:]++\>)\s*|\s*(\ [a-zA-Z\-]++)\s*(\=)\s*(?:(?:(\")\s*(?:(?<=\()\s++|\s++(?=[\(\)\,])|([\w\:\;\#\=\,\.\-\(\)\_\%\']++))?\s*(\"))?)?|(?:(\")\s*(?:(?<=\()\s++|\s++(?=[\(\)\,])|([\w\:\;\#\=\,\.\-\(\)\_\%\']++)))|(?:\s*?(?:(?<=\()\s++|\s++(?=[\(\)\,])|(\ ?[\w\:\;\#\=\,\.\-\(\)\_\%\']++))\s*(\"))|(?:\s*?(?:(?<=\()\s++|\s++(?=[\(\)\,])|(\ ?[\w\:\;\#\=\,\.\-\(\)\_\%\']++)))
    20% less performance than the old :((

    -----------------------------------------------------------------------------------------------

    
    
    POSSIBLE TEXTNODE API OPTIONS:
    1. as they are
    2. trimmed
    3. not more than one space between words 

    
    CAPTURE GROUPS ('X' is placeholder for TOKENS):
    ------------------------------------------------------------------------------------------------------
    opening-of-opening-tag          : (<[TOKENS]++)
    => (?:\s*+(<[\w\-\:]++))
    ------------------------------------------------------------------------------------------------------
    attribute-value-no-quotes       : \s*?( [TOKENS]++)\s*
    attribute-no-value              : \s*?(?:( [TOKENS]++)\s*(=)\s* attribute-values ) 
    => attributes-with-optional-equal-or-optional-value: (?:\s*( [a-zA-Z\-]++)(?:\s*(=)\s*(")(?<ATTRIBUTE-VALUES>)?("))?)*?
    ------------------------------------------------------------------------------------------------------
    self-closing-tag                : \s*(\/>)
    closing-of-opening-tag          : \s*(>)
    text-nodes-inside-open-close    : >(\s*+([^<\s]* ?)\s*+)<
    closing-tag                     : (<\/[TOKENS]++>)\s*
    => self-closing-tag-end-or-tag-end-with-optional-text-node-and-closing-tag: (?:\s*+(\/>)|\s*+(>)\s*(TEXT-NODE)\s*(<\/[\w\-\:]++>)\s*)
    ------------------------------------------------------------------------------------------------------
    single-attribute-value          : (")\s*?([TOKENS]+)\s*(")
    attribute-value-list-start      : (")\s*?([TOKENS]+)
    attribute-value-list-mid        : \s*( [TOKENS]+)
    attribute-value-list-end        : \s*( [TOKENS]+)\s*(")
    => (?:( )\s*+([a-zA-Z\-]++)\s*(?:(=)\s*(")(ATTRIBUTE-VALUES)?("))?)*?
    backup-easy-attr-values:  \s*([^"]*?)\s*
    ------------------------------------------------------------------------------------------------------
    attribute-value-parenthesis     : \s*?(?:(?<=\()\s++|\s++(?=[\(\)\,])|( ?[TOKENS]++))\s*?
    ------------------------------------------------------------------------------------------------------


    RESULT:
    ------------------------------------------------------------------------------------------------------
    attribute                       :   \s*( [X]+)\s*
    (?:(=)\s*__________-)?
    
    opening-tag-or-self-closing     : COMBINE
    full-tag-with-content           : COMBINE
    ------------------------------------------------------------------------------------------------------
    
    
    OLD REGEX WAS FINE BUT ATTRIBTUES DIDNT DO WELL
    ------------------------------------------------------------------------------------------------------
    REGEX: 
    \s*(<[\w-]+)
    |( )\s*([\w-]+)\s*(=)\s*(["'\v])\s*([^"']*?)\s*(["'])
    |\s*(\/?>)
    |>\s*(.*?)\s*<
    |\s*(<\/[\w-]+>)\s*
    oneline: \s*(<[\w-]+)|( )\s*([\w-]+)\s*(=)\s*(["'\v])\s*([^"']*?)\s*(["'])|\s*(\/?>)|>\s*(.*?)\s*<|\s*(<\/[\w-]+>)\s*
    ------------------------------------------------------------------------------------------------------
    
*/



/*

    GENERAL PERFORMANCE IMPROVEMENTS: 

    - IN ANY EQUASION ADD A REGEX THAT WOULD MATCH THE PERFECT CASE, TO THE FRONT
    IF ITS COMMON TO HAPPEN.

    - TRY TO USE ATOMIC GROUPS. LIKE THIS:
    (?=x|y|z)\1


    MATCHING OF UNNEDED WHITESPACE:
    http://www.rexegg.com/regex-quantifiers.html#possessive
    http://www.rexegg.com/regex-quantifiers.html#explicit_greed
    http://instanceof.me/post/52245507631/regex-emulate-atomic-grouping-with-lookahead

    TESTING ON TEXT NODES:

    REGEX:
    default-lazy    : \s*?          =>  >\s*([^<]*?)\s*<
    possessive      : >(?=(\s+))\1  =>  >(?:[^<]|([^< ])(?!<))*<

    BENCHMARKS:

    @TODO: POSSESSIVE TAG NAME OR NOT?
    REGEX   : \s*(<[\w\-\:]+>)\s*([^<]*?)\s*(<\/[\w\-\:]+>)\s*
    TIME    : 
    REGEX   : \s*(<(?=([\w\-\:]+))\2>)\s*([^<]*?)\s*(<\/(?=([\w\-\:]+))\5>)\s*
    TIME    : 



*/


/*
    ATTRIBUTE-VALUE PERFORMANCE: EXCLUDE INVALID VS. INCLUDE VALID 

    @TODO: bench again. 

    TEXT:
    "background-color:red"
    "background-color:red; color: green"
    "   START(0,0)   "
    "
        start mid      mid
        mid 
        end  
    "

    TOKENS:
    [^"'\s]+            15 steps
    [\w:\(\);,=-]+      15 steps

    REGEX   : "\s*?([\w:\(\);,=-]+)\s*"|(?:"\s*?([[\w:\(\);,=-]++)|\s*( [[\w:\(\);,=-]++)\s*"|\s*( [[\w:\(\);,=-]+))
    RESULT  : 283 steps !!! WINNER !!!

    REGEX   : "\s*?([^"'\s]+)\s*"|(?:"\s*?([[^"'\s]++)|\s*( [[^"'\s]++)\s*"|\s*( [[^"'\s]+))
    RESULT  : 922 steps




*/