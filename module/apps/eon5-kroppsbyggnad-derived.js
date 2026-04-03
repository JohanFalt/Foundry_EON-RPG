/**
 * Grundrustning och grundskada från kroppsbyggnad enligt tabellen
 * "Uträkningar av Attribut" (Eon 5) – kolumnerna Grundrustning‡ och Grundskada‡.
 *
 * Värde > 24: grundrustning +1 per steg enligt ⌈(kroppsbyggnad−24)/2⌉ (motsvarar +1 vid ojämnt värde över 24);
 * grundskada: bas från värde 24, sedan +1 på tärningsmodifikator per ⌊(kroppsbyggnad−24)/2⌋ (jämna steg över 24).
 *
 * @param {number} kroppsbyggnadRaw heltalsvärde för kroppsbyggnad (typiskt G+B från wizarden, tabell 4+)
 * @returns {{ rustning: number, grundskada: { tvarde: number, bonus: number } }}
 */
export function getGrundrustningOchGrundskadaFromKroppsbyggnadVarde(kroppsbyggnadRaw) {
    let kroppsbyggnadVarde = Math.floor(Number(kroppsbyggnadRaw));
    if (!Number.isFinite(kroppsbyggnadVarde)) kroppsbyggnadVarde = 4;
    if (kroppsbyggnadVarde < 4) kroppsbyggnadVarde = 4;

    // kroppsbyggnadVarde = 4 … 24: tabellIndex = kroppsbyggnadVarde - 4
    // Grundrustning
    const RUST_TAB = [0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
    // Grundskada som T6-pool (tvarde = antal T6, bonus = mod)
    const SKADA_T_TAB = [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4];
    const SKADA_B_TAB = [2, 2, 3, 3, 0, 0, 1, 1, 2, 2, 3, 3, 0, 0, 1, 1, 2, 2, 3, 3, 0];

    if (kroppsbyggnadVarde <= 24) {
        const tabellIndex = kroppsbyggnadVarde - 4;
        return {
            rustning: RUST_TAB[tabellIndex],
            grundskada: {
                tvarde: SKADA_T_TAB[tabellIndex],
                bonus: SKADA_B_TAB[tabellIndex]
            }
        };
    }

    const rustningVid24 = RUST_TAB[20];
    const grundskadaTarningarVid24 = SKADA_T_TAB[20];
    const grundskadaBonusVid24 = SKADA_B_TAB[20];
    const extraRustning = Math.ceil((kroppsbyggnadVarde - 24) / 2);
    const extraGrundskadaBonus = Math.floor((kroppsbyggnadVarde - 24) / 2);

    return {
        rustning: rustningVid24 + extraRustning,
        grundskada: {
            tvarde: grundskadaTarningarVid24,
            bonus: grundskadaBonusVid24 + extraGrundskadaBonus
        }
    };
}
