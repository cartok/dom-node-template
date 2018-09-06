/*
    IDEA: multiline commentable regex 
    /abc    # comment one
    def     # comment two
    ghi/gm  # comment three

    USAGE:
    // you need to double \ when creating a regex by string, for the first \ to remain, when using string literals
    const foo = new Regext(`
        something\\n     # a comment
        anotherthing    \\# no comment spaces and # should remain
    `, "gm")

    RULES:
    - always escape spaces or tabs with \ in your regex

    QUESTIONS:
    - whats with # that shouldnt be treated as comment?
    - how to treat `/something/` or `/something/gm`?

    STILL UNDER CONSTRUCTION:
    regex:  [\t\ ]*(?<!\\)\#.*$|(?<=\\)\#|\s*
    test: 
            something\n     # a comment
        anotherthing    \# no comment spaces and hashtag should remain
    regex: [\t\ ]*(?<!\\)\#.*
    test:  \# no comment followed by # a comment
    
*/
// export default class Regext {
class Regext {
    // constructor(regex: String, flags: String){
    constructor(regex, flags){
        regex = regex.replace(/[\t\ ]*(?<!\\)#.*$|\s*/gm, "")
        console.log("regex after regexing reged:", regex)
        regex = new RegExp(`${regex}`, `${flags}`)
        console.log("result:", regex)
        return regex 
    }
}