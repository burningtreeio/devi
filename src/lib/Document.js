const debug = require('debug')('devi:Document');
import { basename, dirname } from 'path';

import Document from './Document';
import DocumentStore from './DocumentStore';
import GameJson from './GameJson';

export default class {
    constructor(psApi, rawDoc) {
        this._psApi = psApi;
        this._raw = rawDoc;

        debug(`create ${this.id}`);
        this._json = new GameJson(this);
    }

    update(rawDoc) {
        debug(`update ${this.id}`);
        this._raw = rawDoc;
    }

    get id() {
        return this._raw.id;
    }

    get filename() {
        return this._raw.file;
    }

    get dirname() {
        return dirname(this._raw.file);
    }

    get name() {
        return basename(this._raw.file).replace(/\.psd$/i, '');
    }

    get width() {
        return this._raw.bounds.right;
    }

    get height() {
        return this._raw.bounds.bottom;
    }

    async onChange(event) {
        debug(`onChange ${this.id}`);
        await this._psApi.updateDocument(this);

        const jobs = (event.layers || [])
            .map(({ id }) => id)
            .map(::this._onChangeLayer);
        await Promise.all(jobs);
    }

    async _onChangeLayer(layerId)  {
        const layer = this.getLayer(layerId);
        if (!this._isRenderName(layer.name)) {
            return;
        }

        const hidden = (layer.layers || [])
            .filter(({ name }) => this._isRenderName(name))
            .map(({ id }) => id );
        const filename = await this._psApi.saveLayerToFile(this, layer, hidden);

        this._json.addObject(layer, filename);
    }

    _isRenderName(name) {
        return name.startsWith('object: ');
    }

    getObjectLayers(searchLayer) {
        const layers = [];
        const recurse = (layer) => {
            if (this._isRenderName(layer.name || '')) {
                layers.push(layer);
            } else {
                (layer.layers || []).forEach(recurse);
            }
        }

        (searchLayer.layers || []).forEach(recurse);
        return layers;
    }

    getLayer(layerId) {
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
