const createDocumentFragment = (window !== undefined && window.document !== undefined && window.document.createRange !== undefined)
    ? (tagText) => window.document.createRange().createContextualFragment(tagText)
    : (tagText: String) => {
        const parser = new window.DOMParser()
        const __document__ = parser.parseFromString(tagText, "text/html")
        const fragment = window.document.createDocumentFragment()
        Array.from(__document__.body.childNodes).forEach(n => fragment.appendChild(n))
        return fragment
    }