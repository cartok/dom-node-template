/*
    IDEA: multiline commentable regex 
    /abc    # comment one
    def     # comment two
    ghi/gm  # comment three

    USAGE:
    const foo1 = new Regext(/something/gm)
    
    const foo2 = new Regext("something", "gm")
    foo2.add("anotherthing") => result: /somethinganotherthing/gm

    const foo3 = new Regext(
        /
            something\n
            anotherthing
        /gm
    )

*/
// export default class Regext {
class Regext {
    // constructor(regex: String | RegExp){
    constructor(regex){

    }
}