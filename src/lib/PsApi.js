const debug = require('debug')('devi:PsApi');
import { join } from 'path';

import Document from './Document';
import DocumentStore from './DocumentStore';
import savePixmap from './savePixmap';

export default class {
    constructor(generator, config) {
        debug('create %o', config);

        this._generator = generator;
        this._config = config;
        this._store = new DocumentStore();

        this._registerEvents();
    }

    _registerEvents() {
        debug('registerEvents');

        this._generator.onPhotoshopEvent('currentDocumentChanged', ::this._onCurrentDocumentChanged);
        this._generator.onPhotoshopEvent('imageChanged', ::this._onImageChanged);
    }

    _onImageChanged(event) {
        const docId = event.id;
        if (!this._store.has(docId)) {
            debug(`onImageChanged missing document ${docId} - skipped`);
        } else {
            this._store.get(docId)
                .onChange(event)
                .catch(::console.error);
        }
    }

    _onCurrentDocumentChanged(docId) {
        debug(`onCurrentDocumentChanged ${docId}`);

        if (!this._store.has(docId)) {
            this.loadDocumentById(docId)
                .then(::this._store.add)
                .catch(::console.error);
        }
        this._store.setCurrent(docId);
    }

    async updateDocument(doc) {
        debug(`getDocumentInfo ${doc.id} for update`);
        const rawDoc = await this._generator.getDocumentInfo(doc.id);
        doc.update(rawDoc);
    }

    async loadDocumentById(docId) {
        debug(`getDocumentInfo ${docId}`);
        const rawDoc = await this._generator.getDocumentInfo(docId);
        return new Document(this, rawDoc);
    }

    async loadActive() {
        const doc = await this.loadDocumentById();
        this._store.add(doc);
        this._store.setCurrent(doc.id);
    }

    async saveLayerToFile(doc, rootLayer, hiddenLayerIds = [], opts = {}) {
        // Collect all layer indices
        const showIdx = [];
        const hideIdx = [];
        const reduce = (layer, hidden = false) => {
            if (hidden || hiddenLayerIds.indexOf(layer.id) !== -1) {
                hidden = true;
                hideIdx.push(layer.index);
            } else {
                showIdx.push(layer.index);
            }

            (layer.layers || []).forEach((subLayer) => reduce(subLayer, hidden));
        }
        reduce(rootLayer);

        // Get pixmap from PS
        const allIdx = [...showIdx, ...hideIdx];
        const firstLayerIndex = Math.min(...allIdx);
        const lastLayerIndex = Math.max(...allIdx);
        const pixmap = await this._generator.getPixmap(doc.id, {
            firstLayerIndex, lastLayerIndex, hidden: hideIdx
        }, opts);

        // And finally save it
        const filename = join(doc.dirname, doc.name, `${doc.id}-${rootLayer.id}.png`);
        savePixmap(pixmap, filename);
        return filename;
    }
}
