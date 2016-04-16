const debug = require('debug')('devi:DocumentStore');

export default class {
    _docs = {};

    constructor() {
        debug('create');
    }

    add(doc) {
        debug(`add ${doc.id}`);
        this._docs[doc.id] = doc;
        return this;
    }

    has(docId) {
        return this._docs.hasOwnProperty(docId);
    }

    get(docId) {
        if (!this.has(docId)) {
            throw new Error(`Unable to get unknown document with id: ${docId}`);
        }

        return this._docs[docId];
    }

    setCurrent(docId) {
        if (!this.has(docId)) {
            throw new Error(`Unable to select unknown document with id: ${docId}`);
        }

        debug(`setCurrent ${docId}`);
        this._currentId = docId;
        return this;
    }

    getCurrent() {
        return this._docs[this._currentId];
    }
}
