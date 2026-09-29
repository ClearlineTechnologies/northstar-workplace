import type { Category } from "../../simulation/types";
import * as c5 from "../accounting/controller";
import * as c23 from "../administration/controller";
import * as c17 from "../communication/controller";
import * as c21 from "../compliance/controller";
import * as c11 from "../customer-service/controller";
import * as c7 from "../data-analysis/controller";
import * as c27 from "../decisions/controller";
import * as c9 from "../documents/controller";
import * as c3 from "../economics/controller";
import * as c1 from "../email/controller";
import * as c4 from "../finance/controller";
import * as c14 from "../hr/controller";
import * as c22 from "../incidents/controller";
import * as c13 from "../inventory/controller";
import * as c2 from "../meetings/controller";
import * as c18 from "../negotiation/controller";
import * as c26 from "../operations/controller";
import * as c0 from "../phone/controller";
import * as c25 from "../presentations/controller";
import * as c16 from "../prioritization/controller";
import * as c12 from "../procurement/controller";
import * as c15 from "../project-management/controller";
import * as c20 from "../quality-control/controller";
import * as c24 from "../reporting/controller";
import * as c6 from "../research/controller";
import * as c19 from "../sales/controller";
import * as c10 from "../scheduling/controller";
import * as c8 from "../spreadsheet/controller";
import * as c28 from "../time-management/controller";
import * as c29 from "../workday/controller";
export const controllers = {
  phone: c0,
  email: c1,
  meetings: c2,
  economics: c3,
  finance: c4,
  accounting: c5,
  research: c6,
  "data-analysis": c7,
  spreadsheet: c8,
  documents: c9,
  scheduling: c10,
  "customer-service": c11,
  procurement: c12,
  inventory: c13,
  hr: c14,
  "project-management": c15,
  prioritization: c16,
  communication: c17,
  negotiation: c18,
  sales: c19,
  "quality-control": c20,
  compliance: c21,
  incidents: c22,
  administration: c23,
  reporting: c24,
  presentations: c25,
  operations: c26,
  decisions: c27,
  "time-management": c28,
  workday: c29,
} satisfies Record<Category, typeof c0>;
