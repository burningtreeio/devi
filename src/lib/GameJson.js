const debug = require('debug')('devi:GameJson');
import { basename, dirname, join } from 'path';
import { mkdirSync } from 'mkdir-recursive';
import { writeFileSync } from 'fs';

export default class {
    _state = {
        devi: {
            version: __VERSION__,
            origin: null,
            updatedAt: null
        },
        properties: {},
        children: [],
        objects: {}
    };

    constructor(doc) {
        debug('create');
        this._doc = doc;
        this._filename = join(this._doc.dirname, this._doc.name, this._doc.name + '.json');

        this._state.devi.origin = basename(this._doc.filename);
    }

    _setDimension() {
        this._state.dimension = {
            width: `${this._doc.width}px`,
            height: `${this._doc.height}px`
        };
    }

    addObject(layer, filename) {
        const width = Math.abs(layer.bounds.right - layer.bounds.left);
        const height = Math.abs(layer.bounds.bottom - layer.bounds.top);
        const obj = {
            _getLayer: () => layer,
            type: 'object',
            name: layer.name.replace(/^[^:]+: ?/, ''),
            dimension: {
                width: `${width}px`,
                height: `${height}px`
            },
            properties: {},
            children: [] // see this._updateChildren()
        };

        if (filename) {
            obj.type = 'sprite';
            obj.filename = basename(filename);
        }

        const id = this._getLayerId(layer);
        this._state.objects[id] = obj;
        debug(`addObject ${id}`);

        this.save();
    }

    _getLayerId(layer) {
        return '' + layer.id;
    }

    /**
     * The children of *ALL* objects are updated within this method. This is
     * important, as a parent node might be added *BEFORE* their children. In
     * this case we would simple ignore all children .. and .. well .. this
     * would be a bug :-)
     */
    _updateChildren() {
        this._updateRootChildren();
        this._updateObjectChildren();
    }

    _updateRootChildren() {
        debug('update root children');
        this._state.children = [];
        this._doc.getObjectLayers(this._doc._raw).forEach((layer) => {
            const child = this._formatAsChild(layer);
            this._state.children.push(child);
        });
    }

    _updateObjectChildren() {
        debug(`update object children`);
        for (const id of Object.keys(this._state.objects)) {
            const object = this._state.objects[id];
            object.children = [];

            const searchLayer = object._getLayer();
            this._doc.getObjectLayers(searchLayer).forEach((layer) => {
                const child = this._formatAsChild(layer, searchLayer);
                object.children.push(child);
            });
        }
    }

    _formatAsChild(layer, parent = null) {
        const child = {
            objectId: this._getLayerId(layer),
            visible: layer.visible,
            position: {
                origin: 'world',
                x: `${layer.bounds.top}px`,
                y: `${layer.bounds.left}px`
            }
        };

        if (parent) {
            const isEmpty = this._emptyBounds(layer.bounds);
            const x = isEmpty ? 0 : layer.bounds.top - parent.bounds.top;
            const y = isEmpty ? 0 : layer.bounds.left - parent.bounds.left;
            child.position = {
                origin: 'parent',
                x: `${x}px`,
                y: `${y}px`
            };
        }

        return child;
    }

    _emptyBounds(bounds) {
        return bounds.top === 0
            && bounds.bottom === 0
            && bounds.left === 0
            && bounds.right === 0;
    }

    save() {
        // Update state
        debug(`saving ${this._doc.id}`);
        this._setDimension();
        this._updateChildren();
        this._state.devi.updatedAt = (new Date()).toISOString();

        // Ensure parent dir exists
        const saveDir = dirname(this._filename);
        mkdirSync(saveDir);

        // Write stuff
        debug(`writing ${this._filename}`);
        writeFileSync(this._filename, JSON.stringify(this._state));
    }
}
