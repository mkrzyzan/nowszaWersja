export function getStructurePart(respData, i) {
    return '0x' + respData.slice(2).slice(64*i, 64*(1+i));
}