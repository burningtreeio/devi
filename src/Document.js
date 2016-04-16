const debug = require('debug')('devi:Document');

import Document from './Document';
import DocumentStore from './DocumentStore';

export default class {
    constructor(psApi, rawDoc) {
        this._psApi = psApi;
        this._raw = rawDoc;

        debug(`create ${this.id}`);
    }

    update(rawDoc) {
        this._raw = rawDoc;
    }

    get id() {
        return this._raw.id;
    }

    async onChange(event) {
        debug(`onChange ${this.id}`);
        await this._psApi.updateDocument(this);

        const changedLayerIds = (event.layers || [])
            .map(({ id }) => id)
            .forEach(::this._onChangeLayer);
    }

    async _onChangeLayer(layerId, ...x)  {
        const layer = this._getLayer(layerId);
        if (!this._isRenderName(layer.name)) {
            return;
        }

        const hidden = (layer.layers || [])
            .filter(({ name }) => this._isRenderName(name))
            .map(({ id }) => id );
        await this._psApi.saveLayerToFile(this.id, layer, hidden);
    }

    _isRenderName(name) {
        return name.startsWith('object: ');
    }

    _getLayer(layerId) {
        const recurse = (layer) => {
            if (layer.id === layerId) {
                return layer;
            }

            // Note: The layers property is not always present!
            const searchLayers = (layer.layers || []);
            for (const subLayer of searchLayers) {
                const subResult = recurse(subLayer);
                if (subResult) {
                    return subResult;
                }
            }

            return null;
        }

        // Note: We *could* simply pass this._raw but than the first id-check
        //       would be made against the docId. This might be safe but with
        //       this temp object we're sure to be on the safe side :)
        return recurse({ id: null, layers: this._raw.layers });
    }
}
