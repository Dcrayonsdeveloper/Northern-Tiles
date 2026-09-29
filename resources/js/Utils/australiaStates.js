/**
 * The states and territories Northern Tile delivers to.
 *
 * The code is what gets stored and what ends up on a courier label, so that is
 * the value; the full name is only ever shown to the customer. A free-text box
 * here produced "Vic", "VIC", "Victoria" and "victoria" for the same place,
 * which is no use for sorting deliveries or working out a shipping zone.
 */
export const AU_STATES = [
    { code: 'ACT', name: 'Australian Capital Territory' },
    { code: 'NSW', name: 'New South Wales' },
    { code: 'NT', name: 'Northern Territory' },
    { code: 'QLD', name: 'Queensland' },
    { code: 'SA', name: 'South Australia' },
    { code: 'TAS', name: 'Tasmania' },
    { code: 'VIC', name: 'Victoria' },
    { code: 'WA', name: 'Western Australia' },
];

/** Every valid code, for anything that needs to check one. */
export const AU_STATE_CODES = AU_STATES.map((s) => s.code);
