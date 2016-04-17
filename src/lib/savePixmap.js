const debug = require('debug')('devi:savePixmap');
import { createWriteStream, unlinkSync } from 'fs';
import { dirname } from 'path';
import { mkdirSync } from 'mkdir-recursive';
import { PNG } from 'pngjs';

export default (pixmap, outfile) => {
    // Ensure parent dir exists
    const saveDir = dirname(outfile);
    mkdirSync(saveDir);

    // Remove empty images
    if (pixmap.width === 0 || pixmap.height === 0) {
        try {
            unlinkSync(outfile);
        } catch (err) {
            // don't throw if the file didn't even exists
        }
        return false;
    }

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
    var png = new PNG({ width: pixmap.width, height: pixmap.height });
    png.data = pixmap.pixels;

    // Save
    debug(`writing ${outfile}`);
    png.pack().pipe(createWriteStream(outfile));
    return true;
};
