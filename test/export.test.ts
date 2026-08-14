import assert from "node:assert/strict";
import test from "node:test";
import { propertyCsv, remindersFor, type PropertyData } from "../src/property_export.ts";

const data: PropertyData = { requests: [], documents: [], inspections: [
  { unit: "3B", dueOn: "2026-08-09", completed: false },
  { unit: "2A", dueOn: "2026-08-20", completed: false },
  { unit: "1C", dueOn: "2026-08-01", completed: true }
] };

test("the export marks only incomplete inspections due today or earlier", () => {
  assert.deepEqual(remindersFor(data, "2026-08-10"), ["3B"]);
  assert.match(propertyCsv(data, "2026-08-10"), /inspection_reminder.*3B/);
  assert.doesNotMatch(propertyCsv(data, "2026-08-10"), /inspection_reminder.*2A/);
});
