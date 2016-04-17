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
        const obj = {
            type: 'object',
            name: layer.name.replace(/^[^:]+: ?/, ''),
            dimension: {
                width: Math.abs(layer.bounds.right - layer.bounds.left),
                height: Math.abs(layer.bounds.bottom - layer.bounds.top),
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
        // for (const id of Object.keys(this._state.objects)) {
        //     const obj = this._state.objects[id];
        //     const layer = this._doc.getLayer(id);
        //     debug(obj);
        // }
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
