"use client";
import type { ComponentType } from "react";
import type { Category } from "../../simulation/types";
import { LedgerWorkbench } from "../accounting/workspace";
import { RecordsOffice } from "../administration/workspace";
import { TeamMessenger } from "../communication/workspace";
import { ProcedureRunner } from "../compliance/workspace";
import { ServiceCaseDesk } from "../customer-service/workspace";
import { AnalyticsStudio } from "../data-analysis/workspace";
import { DecisionRoom } from "../decisions/workspace";
import { DocumentComposer } from "../documents/workspace";
import { MarketLab } from "../economics/workspace";
import { EmailClient } from "../email/workspace";
import { FinanceDesk } from "../finance/workspace";
import { PeopleDesk } from "../hr/workspace";
import { IncidentCommand } from "../incidents/workspace";
import { StockControl } from "../inventory/workspace";
import { MeetingRoom } from "../meetings/workspace";
import { BargainingTable } from "../negotiation/workspace";
import { OperationsControl } from "../operations/workspace";
import { CallConsole } from "../phone/workspace";
import { PresentationStudio } from "../presentations/workspace";
import { PriorityQueue } from "../prioritization/workspace";
import { SourcingDesk } from "../procurement/workspace";
import { DeliveryBoard } from "../project-management/workspace";
import { QualityBench } from "../quality-control/workspace";
import { ReportBuilder } from "../reporting/workspace";
import { EvidenceLibrary } from "../research/workspace";
import type { GameProps } from "../runtime/types";
import { SalesPipeline } from "../sales/workspace";
import { CalendarPlanner } from "../scheduling/workspace";
import { SpreadsheetLab } from "../spreadsheet/workspace";
import { FocusClock } from "../time-management/workspace";
import { WorkdayDesktop } from "../workday/workspace";
export const gameComponents: Record<Category, ComponentType<GameProps>> = {
  phone: CallConsole,
  email: EmailClient,
  meetings: MeetingRoom,
  economics: MarketLab,
  finance: FinanceDesk,
  accounting: LedgerWorkbench,
  research: EvidenceLibrary,
  "data-analysis": AnalyticsStudio,
  spreadsheet: SpreadsheetLab,
  documents: DocumentComposer,
  scheduling: CalendarPlanner,
  "customer-service": ServiceCaseDesk,
  procurement: SourcingDesk,
  inventory: StockControl,
  hr: PeopleDesk,
  "project-management": DeliveryBoard,
  prioritization: PriorityQueue,
  communication: TeamMessenger,
  negotiation: BargainingTable,
  sales: SalesPipeline,
  "quality-control": QualityBench,
  compliance: ProcedureRunner,
  incidents: IncidentCommand,
  administration: RecordsOffice,
  reporting: ReportBuilder,
  presentations: PresentationStudio,
  operations: OperationsControl,
  decisions: DecisionRoom,
  "time-management": FocusClock,
  workday: WorkdayDesktop,
};
export function GameSurface(p: GameProps) {
  const Component = gameComponents[p.scenario.category];
  return <Component key={p.scenario.id} {...p} />;
}
