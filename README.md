# DOM-Node-Template
*A middle way to create and work with HTML or SVG (or mixed)*

## Installation:
```npm install dom-node-template```  

## Usage
+ module import
```javascript
import NodeTemplate from "dom-node-template" 
```
+ html import
```html
<script src="https://cdn.jsdelivr.net/npm/dom-node-template/dist/bundle.js"></script> 
```
+ create template: 
```javascript
const html = new NodeTemplate(`<h1>Title</h1>`)  
```
+ append the template:
```javascript
element.appendChild(html.fragment)
```

#### What you get:
The constructor returns an Object containing your **HTML in a document fragment**. It offers you the **references** of the **root** element if there is one, an all Elements that have the **id** or **data-ref** attribute set.
```javasript
{
    fragment = DocumentFragment,
    root = HTMLElement | Array<HTMLElement>,
    ids = {},                                   // References: All Nodes that got the 'id' attribute set.
    refs = {},                                  // References: All Nodes that got the 'data-ref' attribute set.
}
```

### Working with jQuery
```javascript
const html = new NodeTemplate(`
    <div id="app-container">
        <h1>foo</h1>
        <div id="app-bar">
            // ...     
        </div>
    </div>
`)
// before
$("#app-bar").on("click", () => {})
// after
$(html.ids["app-bar"]).on("click", () => {})
```

### Usage Example:
#### Definition of a ListView class 
```javascript
/**
 * file: ListView.js
 *
 */
import NodeTemplate from "dom-node-template"

export default class ListView {
    constructor(data: any){
        this.html = new NodeTemplate(`
            <div class="list-view">
                <h1>${data.header}</h1>
                <ul data-ref="list">
                    ${ data.items.map(item => `<li>${item}</li>`).join("") }
                </ul>
            </div>
        `)
    }
    addItem(item: String | Array<String>){
        if(typeof item === "string"){
            // > you may not need a new node template for 
            // > an li tag, this is just an example.
            // > you could also have a ListItem class instead,
            // > or create the li with document methods.
            const li = new NodeTemplate(`<li>${item}</li>`, { nodeOnly: true })
            this.html.refs["list"].appendChild(li)
        } 
        else if(item instanceof Array){
            let li = undefined
            item.forEach(i => {
                li = new NodeTemplate(`<li>${i}</li>`, { nodeOnly: true })
                this.html.refs["list"].appendChild(li)
            })
        }
    }
    // ... more methods ...
}
```

#### Implementation of the ListView
```javascript
/**
 * file: appPresenter.js
 *
 */
import * as appView from "./appView.js"
import $ from "jquery"

const list = new ListView({
    header: "Medication",
    data: ["trust", "love", "drugs", "meditation"]
})

// > imagine appView.html is another NodeTemplate.
appView.html.appendChild(list.fragment)

// VIEW BINDING 
$(appView.html.refs["something"]).on("click", () => {
    list.addItem(e.target.innerText)
})

// or just
list.add("music")
```