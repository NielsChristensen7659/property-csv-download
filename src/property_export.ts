export type MaintenanceRequest = { id: string; unit: string; status: "open" | "scheduled" | "closed"; summary: string };
export type TenantDocument = { tenant: string; kind: "lease" | "insurance"; expiresOn: string };
export type InspectionReminder = { unit: string; dueOn: string; completed: boolean };

export type PropertyData = {
  requests: MaintenanceRequest[];
  documents: TenantDocument[];
  inspections: InspectionReminder[];
};

export function remindersFor(data: PropertyData, today: string): string[] {
  return data.inspections
    .filter((inspection) => !inspection.completed && inspection.dueOn <= today)
    .map((inspection) => inspection.unit);
}

function csvCell(value: string): string {
  return '"' + value.replaceAll('"', '""') + '"';
}

export function propertyCsv(data: PropertyData, today: string): string {
  const rows = [["section", "id", "unit_or_tenant", "status_or_kind", "detail", "due_on"]];
  for (const request of data.requests) rows.push(["maintenance", request.id, request.unit, request.status, request.summary, ""]);
  for (const document of data.documents) rows.push(["tenant_document", "", document.tenant, document.kind, "", document.expiresOn]);
  for (const unit of remindersFor(data, today)) rows.push(["inspection_reminder", "", unit, "due", "inspection required", today]);
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}
