/**
 * The states, territories and delivery cities Northern Tile ships to.
 *
 * Codes are what get stored and what end up on a courier label, so those are
 * the values; full names are only ever shown to the customer. Free-text boxes
 * here produced "Vic", "VIC", "Victoria" and "victoria" for the same place,
 * which is no use for sorting deliveries or working out a shipping zone.
 *
 * Each state carries its own city list, capital first, ending in an "Other"
 * catch-all — a full suburb list would be thousands of entries and still miss
 * one, and the postcode already pins the exact destination.
 */
export const AU_STATES = [
    {
        code: 'ACT',
        name: 'Australian Capital Territory',
        cities: ['Canberra', 'Other ACT'],
    },
    {
        code: 'NSW',
        name: 'New South Wales',
        cities: ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Other NSW'],
    },
    {
        code: 'NT',
        name: 'Northern Territory',
        cities: ['Darwin', 'Alice Springs', 'Other NT'],
    },
    {
        code: 'QLD',
        name: 'Queensland',
        cities: ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Toowoomba', 'Townsville', 'Cairns', 'Other QLD'],
    },
    {
        code: 'SA',
        name: 'South Australia',
        cities: ['Adelaide', 'Mount Gambier', 'Other SA'],
    },
    {
        code: 'TAS',
        name: 'Tasmania',
        cities: ['Hobart', 'Launceston', 'Devonport', 'Other TAS'],
    },
    {
        code: 'VIC',
        name: 'Victoria',
        cities: ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Other VIC'],
    },
    {
        code: 'WA',
        name: 'Western Australia',
        cities: ['Perth', 'Bunbury', 'Other WA'],
    },
];

/** Every valid code, for anything that needs to check one. */
export const AU_STATE_CODES = AU_STATES.map((s) => s.code);

/** The cities offered for one state code; empty until a state is chosen. */
export const citiesForState = (code) =>
    AU_STATES.find((s) => s.code === String(code || '').toUpperCase())?.cities ?? [];
