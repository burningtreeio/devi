import PsApi from './lib/PsApi';

export async function init(generator, config) {
    const ps = new PsApi(generator, config);
    try {
        await ps.loadActive();
    } catch (err) {
        console.error(err);
    }
}
