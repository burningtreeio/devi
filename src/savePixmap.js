const debug = require('debug')('devi:savePixmap');
import { mkdirSync } from 'mkdir-recursive';
import { dirname } from 'path';

import { PNG } from 'pngjs';
import { createWriteStream } from 'fs';

export default (pixmap, outfile) => {
    // Convert from ARGB to RGBA, we do this every 4 pixel values (channelCount)
    const pixels = pixmap.pixels;
    for (let i = 0; i < pixels.length; i += pixmap.channelCount) {
        const tmp = pixels[i];
        pixels[i + 0] = pixels[i + 1];
        pixels[i + 1] = pixels[i + 2];
        pixels[i + 2] = pixels[i + 3];
        pixels[i + 3] = tmp;
    }

    // Init a new PNG
    var png = new PNG({
        // Note: 1x1 px are required to save empty PNGs for empty groups
        width: Math.max(1, pixmap.width),
        height: Math.max(1, pixmap.height)
    });
    // Note: PNGJS is not very happy about a empty buffer ...
    if (pixmap.width > 0 && pixmap.height > 0) {
        png.data = pixmap.pixels;
    }

    // Ensure parent dir exists
    const saveDir = dirname(outfile);
    mkdirSync(saveDir);

    // Save
    debug(`writing ${outfile}`);
    png.pack().pipe(createWriteStream(outfile));
};
