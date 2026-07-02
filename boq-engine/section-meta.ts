import type { BOQSectionId } from './models/boq-document'

/**
 * Human-readable metadata for the 12 canonical BOQ sections. Kept as a
 * central table so titles/descriptions can be localised or overridden without
 * touching the engine.
 */
export const BOQ_SECTION_META: Readonly<
  Record<BOQSectionId, { title: string; description: string; order: number }>
> = Object.freeze({
  display:         { order: 1,  title: 'Display Modules',         description: 'LED / LCD panels supplied per square metre.' },
  cabinets:        { order: 2,  title: 'Cabinets',                 description: 'Structural cabinets — fixed count derived from screen size.' },
  controllers:     { order: 3,  title: 'Controllers',              description: 'Sending / control units driving the display.' },
  receiving_cards: { order: 4,  title: 'Receiving Cards',          description: 'Panel-side receiving cards (one per cabinet).' },
  power_supplies:  { order: 5,  title: 'Power Supplies',           description: 'PSU modules (one per cabinet).' },
  cables:          { order: 6,  title: 'Cables',                   description: 'Signal and power cabling as a bill lot.' },
  steel:           { order: 7,  title: 'Steel Structure',          description: 'Rear/front support structure for the wall.' },
  accessories:     { order: 8,  title: 'Accessories',              description: 'Mounting hardware, tools, spares.' },
  installation:    { order: 9,  title: 'Installation',             description: 'Labour, mobilisation and mechanical install.' },
  commissioning:   { order: 10, title: 'Commissioning & Testing',  description: 'On-site alignment, colour calibration, sign-off.' },
  warranty:        { order: 11, title: 'Warranty',                 description: 'Extended warranty coverage beyond the standard term.' },
  amc:             { order: 12, title: 'Annual Maintenance',       description: 'Post-warranty AMC — priced per contract year.' },
})
