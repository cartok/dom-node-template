describe("Node Template Tests", () => {
    describe("create a node and validate its state.", () => {
        const s = new NodeTemplate(`
            <div id="container">
                <h1 class="hodor" style="
                    backgroud-color: #123;
                    color: #123;
                    width: 123px; 
                ">hello kitty</h1>
            </div>
        `)
        console.log(s)
        it("should create node template", () => {
            s.text.should.be.an("string")
            s.refs.should.be.an("object")
            s.ids.should.be.an("object")    
        })
        it("should have 1 id", () => {
            Object.keys(s.ids).length.should.equal(1)
        })
        it("should have a h1 tag 'hello kitty' as text node as first child", () => {
            s.ids["container"].firstElementChild.textContent.should.equal("hello kitty")
        })
    })
})
