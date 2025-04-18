import LibRawModule from './libraw.js';

let ready;
let raw;
let Module;

async function initLibRaw() {
	ready = (async ()=>{
		Module = await LibRawModule();
		raw = new Module.LibRaw();
	})();
}

initLibRaw();

self.onmessage = async (event) => {
  const { file, settings } = event.data;
	const buffer = await file.arrayBuffer();
	await ready;
	const byteArray = new Uint8Array(buffer);
	const length = byteArray.length;
	const ptr = Module._malloc(length);

  try {
  	Module.HEAPU8.set(byteArray, ptr);
		await raw.open(ptr, length, settings); 
		const out = await raw.extractThumbnail();

		const transferList = [];

		if (Array.isArray(out)) {
			out.forEach(item => {
				if (item?.buffer instanceof ArrayBuffer) {
					transferList.push(item.buffer);
				}
			});
		} else if (typeof out === 'object' && out !== null) {
			Object.values(out).forEach(item => {
				if (item?.buffer instanceof ArrayBuffer) {
					transferList.push(item.buffer);
				}
			});
		}

  	self.postMessage({ out }, transferList);
  } catch (err) {
    self.postMessage({ error: err.message });
  } finally {
		Module._free(ptr);
	}
};
