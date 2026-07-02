/**
 * Reasonable industry defaults for the display market. Every field is
 * overridable through the `CommercialInput` model.
 */
export const COMMERCIAL_DEFAULTS = Object.freeze({
  marginPercent: 25,
  discountPercent: 0,

  warrantyYears: 2,
  warrantyCostPercent: 3,       // % of material cost
  amcYears: 3,
  amcCostPercentPerYear: 5,     // % of material cost per year

  // Sensible per-unit prices used ONLY as illustrative fallbacks when the
  // caller hasn't supplied any. Real projects always override.
  fallbackLedCostPerSqM: 90000,   // INR (used only if user supplies no data)
  fallbackCabinetCost: 45000,
  fallbackControllerCost: 65000,
  fallbackReceivingCardCost: 3500,
  fallbackPowerSupplyCost: 6500,
  fallbackCablesCost: 15000,
  fallbackAccessoriesCost: 8000,
  fallbackSteelCost: 40000,
  fallbackTransportationCost: 25000,
  fallbackInstallationCost: 55000,
  fallbackCommissioningCost: 20000,

  // A single project-level tax rate is the MVP model. Line-item tax remains
  // architecturally possible (see `LineItem.taxRateOverride`).
  defaultTax: { label: 'GST', ratePercent: 18 },
})

export type CommercialDefaultKey = keyof typeof COMMERCIAL_DEFAULTS
