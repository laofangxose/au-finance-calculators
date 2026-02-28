# AU Financial Rule Table Sources

This folder stores JSON rule tables for Australian financial calculations.
Values must remain data-driven and versioned by financial year where applicable.

## Files

- `tax/brackets/FY2024-25.json`
  - Resident individual tax rates (ATO)
  - Source: https://www.ato.gov.au/rates/individual-income-tax-rates/

- `tax/brackets/FY2025-26.json`
  - Resident individual tax rates (ATO)
  - Source: https://www.ato.gov.au/rates/individual-income-tax-rates/

- `tax/brackets/FY2026-27.json`
  - Resident individual tax rates (ATO legislation detail, effective from 1 July 2026)
  - Source: https://www.ato.gov.au/about-ato/new-legislation/in-detail/individuals/personal-income-tax-new-tax-cuts-for-every-australian-taxpayer

- `medicare-levy/FY2024-25.json`
  - Medicare levy base assumption
  - Source: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/what-is-the-medicare-levy

- `medicare-levy/FY2025-26.json`
  - Medicare levy base assumption
  - Source: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/what-is-the-medicare-levy

- `medicare-levy/FY2026-27.json`
  - Medicare levy base assumption
  - Source: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/what-is-the-medicare-levy

- `residuals/ato-car-lease-residuals.json`
  - ATO car lease minimum residual schedule (industry-standard use of ATO ID 2002/1004 values)
  - Keep configurable and review when tax guidance changes.

- `fbt/config.json`
  - FBT statutory formula configuration defaults
  - Source: https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/cars-and-fbt/taxable-value-of-a-car-fringe-benefit

- `lct/thresholds.json`
  - Luxury Car Tax (LCT) rate and threshold assumptions by FY
  - Source: https://www.ato.gov.au/tax-rates-and-codes/luxury-car-tax-rate-and-thresholds
