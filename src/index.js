import PsApi from './PsApi';

export async function init(generator, config) {
    const ps = new PsApi(generator, config);
    await ps.loadActive();
}
