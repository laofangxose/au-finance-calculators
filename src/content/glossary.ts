export type GlossaryEntry = {
  term: string;
  short: string;
  detail: string;
};

export const novatedLeaseGlossary: GlossaryEntry[] = [
  {
    term: "ICE",
    short: "Internal Combustion Engine vehicle.",
    detail: "A petrol or diesel vehicle that does not qualify as a full battery EV.",
  },
  {
    term: "BEV",
    short: "Battery Electric Vehicle.",
    detail: "A fully electric vehicle powered by a battery and electric motor.",
  },
  {
    term: "PHEV",
    short: "Plug-in Hybrid Electric Vehicle.",
    detail:
      "A hybrid that can be charged externally. FBT treatment can differ due to post-1 April 2025 rules.",
  },
  {
    term: "FBT",
    short: "Fringe Benefits Tax.",
    detail:
      "Tax regime applied to certain non-cash benefits provided through employment, including car benefits.",
  },
  {
    term: "ECM",
    short: "Employee Contribution Method.",
    detail:
      "A post-tax employee contribution approach used to reduce or eliminate FBT taxable value.",
  },
  {
    term: "Residual",
    short: "Balloon amount at lease end.",
    detail:
      "The amount remaining at the end of the lease term. It can be paid, refinanced, or handled based on lease terms.",
  },
  {
    term: "Gross-up Factor",
    short: "FBT gross-up conversion factor.",
    detail:
      "A factor used in detailed FBT calculations to convert taxable value to a grossed-up amount. Not modelled directly in this MVP estimate.",
  },
];
