describe("Performance init should work", () => {
    const refs = [
        "rec-start",
        "rec-child-end",
        "rec-sibling-end",
    ]
    const ids = [
        "rec-start",
        "rec-child-end",
        "rec-sibling-end",
    ]
    const template = new NodeTemplate(
        `
            <div id="rec-start" data-ref="rec-start">
                <div>
                    <div>
                        <div>
                            <div>
                                <div id="rec-child-end" data-ref="rec-child-end"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div id="rec-sibling-end" data-ref="rec-sibling-end"></div>
        `, 
        {
            refs,
            ids,
        }
    )
    console.log(template)
    it("should have all references", () => {
        const refTest = refs.every(ref => template.refs[ref] instanceof Node)
        const idTest = ids.every(id => template.ids[id] instanceof Node)
        refTest.should.equal(true)
        idTest.should.equal(true)
        Object.keys(template.refs).length.should.equal(3)
        Object.keys(template.ids).length.should.equal(3)
    })
})