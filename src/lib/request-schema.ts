import {
  COST_CENTERS,
  defaultDepartmentOptions,
  DIVISIONS,
  HEADCOUNT_TYPES,
  JOB_LEVELS,
  PRIORITY_LEVELS,
  REQUEST_COMPANIES,
  WORKFORCE_TYPES,
  WORK_LOCATIONS,
  type RequestCompany,
} from "./recruitment-request";
import { getSupabaseBrowserClient } from "./supabase/client";

export type RequestFieldType =
  | "text"
  | "textarea"
  | "select"
  | "number"
  | "date"
  | "person";

export type RequestSchemaField = {
  id: string;
  label: string;
  type: RequestFieldType;
  required: boolean;
  enabled: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  dependsOn?: string;
  optionsByParent?: Record<string, string[]>;
};

export type RequestSchema = {
  title: string;
  description: string;
  sectionTitle: string;
  fields: RequestSchemaField[];
};

const SCHEMA_KEY = (company: RequestCompany) => `hr-request-form-schema:${company}`;
const RESPONSES_KEY = "hr-recruitment-requests";

export function defaultRequestSchema(): RequestSchema {
  return {
    title: "Recruitment Request Form",
    description:
      "This form is required to request new or replacement hires, to be used for tracking.",
    sectionTitle: "Application Details",
    fields: [
      field("company", "Company", "select", true, "Select", REQUEST_COMPANIES),
      field("job_position", "Job Position", "text", true, "Enter the Position Title"),
      field("min_job_level", "Min. Job Level", "select", true, "Select", JOB_LEVELS),
      field("max_job_level", "Max Job Level", "select", true, "Select", JOB_LEVELS),
      field("workforce_type", "Workforce type", "select", true, "Please choose as needed.", WORKFORCE_TYPES),
      field(
        "division",
        "Division",
        "select",
        true,
        "Select",
        DIVISIONS.map((item) => item.label),
      ),
      {
        ...field("department", "Department", "select", true, "Select"),
        dependsOn: "division",
        optionsByParent: defaultDepartmentOptions(),
      },
      field("work_location", "Work Location", "select", true, "Select", WORK_LOCATIONS),
      field("headcount_number", "Headcount Number", "number", true, "Not less than 1"),
      field("headcount_type", "Headcount Type", "select", true, "Please choose as needed.", HEADCOUNT_TYPES),
      field(
        "employee_replaced",
        "Employee to be Replaced (for Replacement Headcount)",
        "text",
        false,
        "Please specify the full name of the employee to be replaced.",
      ),
      field("cost_center", "Cost Center", "select", true, "Select", COST_CENTERS),
      field("min_salary", "Min Monthly Salary (Nett THP)", "text", false, "Please fill in as needed."),
      field("max_salary", "Max Monthly Salary (Nett THP)", "text", false, "Please fill in as needed."),
      field(
        "priority_level",
        "Priority Level",
        "select",
        true,
        "Please choose as needed.",
        PRIORITY_LEVELS.map((item) => item.label),
      ),
      field("expected_join_date", "Expected Join Date", "date", true, "Please choose as needed."),
      field("direct_supervisor", "Direct Supervisor (N+1)", "person", true, "Full name", undefined, "Please fill in as needed."),
      field("indirect_supervisor", "Indirect Supervisor (Matrix N+1)", "person", false, "Full name", undefined, "Please fill in as needed."),
      field(
        "job_description",
        "Job Description",
        "textarea",
        true,
        "You may put a link to the JD document (if any) or describe the job scope here.",
      ),
      field("additional_notes", "Additional Notes", "textarea", false, "Enter"),
      field(
        "assessment",
        "Specific Assessment Required",
        "textarea",
        false,
        "Please specify if there is any assessment method to be done for this role.",
      ),
      field(
        "interviewers",
        "Interviewers",
        "textarea",
        true,
        "Please specify who are required to interview the candidates",
      ),
    ],
  };
}

function field(
  id: string,
  label: string,
  type: RequestFieldType,
  required: boolean,
  placeholder?: string,
  options?: readonly string[],
  hint?: string,
): RequestSchemaField {
  return {
    id,
    label,
    type,
    required,
    enabled: true,
    placeholder,
    hint,
    options: options ? [...options] : undefined,
  };
}

export function emptyAnswers(schema: RequestSchema) {
  return Object.fromEntries(schema.fields.map((item) => [item.id, ""]));
}

export function validateAnswers(
  schema: RequestSchema,
  answers: Record<string, string>,
) {
  const errors: Record<string, string> = {};
  for (const item of schema.fields) {
    if (!item.enabled || !item.required) continue;
    if (!String(answers[item.id] ?? "").trim()) {
      errors[item.id] = `${item.label} is required.`;
    }
  }
  const headcount = answers.headcount_number;
  if (headcount && (Number.isNaN(Number(headcount)) || Number(headcount) < 1)) {
    errors.headcount_number = "Headcount Number must be at least 1.";
  }
  return errors;
}

export function visibleFormFields(schema: RequestSchema) {
  return schema.fields.filter((item) => item.enabled && item.id !== "company");
}

export function normalizeRequestSchema(schema: RequestSchema): RequestSchema {
  return {
    ...schema,
    fields: schema.fields.map((item) => {
      if (item.id !== "department") return item;
      const mapped = item.optionsByParent ?? {};
      const hasMap = Object.values(mapped).some((options) => options.length > 0);
      return {
        ...item,
        dependsOn: "division",
        optionsByParent: hasMap ? mapped : defaultDepartmentOptions(),
      };
    }),
  };
}

function schemaFromRow(row: Record<string, unknown> | null | undefined) {
  const raw = row?.schema ?? row?.form_schema;
  return raw ? normalizeRequestSchema(raw as RequestSchema) : null;
}

export async function loadRequestSchema(company: RequestCompany) {
  const fallback = defaultRequestSchema();
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      // select * — do not filter on company/id. Older tables only have id.
      const { data, error } = await supabase
        .from("recruitment_form_settings")
        .select("*")
        .limit(20);
      if (!error && data?.length) {
        const rows = data as Record<string, unknown>[];
        const match = rows.find((row) => row.company === company);
        const parsed = schemaFromRow(match) ?? schemaFromRow(rows[0]);
        if (parsed) return parsed;
      }
    }
  } catch {
    /* use local */
  }

  if (typeof window === "undefined") return fallback;
  try {
    const raw =
      window.localStorage.getItem(SCHEMA_KEY(company)) ??
      window.localStorage.getItem("hr-request-form-schema");
    return raw ? normalizeRequestSchema(JSON.parse(raw) as RequestSchema) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveRequestSchema(
  company: RequestCompany,
  schema: RequestSchema,
) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SCHEMA_KEY(company), JSON.stringify(schema));
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const updated_at = new Date().toISOString();
  const { data: existing } = await supabase
    .from("recruitment_form_settings")
    .select("*")
    .limit(1);
  const sample = existing?.[0] as Record<string, unknown> | undefined;

  if (sample && "company" in sample) {
    const { error } = await supabase.from("recruitment_form_settings").upsert(
      { company, schema, updated_at },
      { onConflict: "company" },
    );
    if (error) throw error;
    return;
  }

  const legacy = await supabase.from("recruitment_form_settings").upsert(
    { id: 1, schema, updated_at },
    { onConflict: "id" },
  );
  if (!legacy.error) return;

  const { error } = await supabase.from("recruitment_form_settings").upsert(
    { company, schema, updated_at },
    { onConflict: "company" },
  );
  if (error) throw error;
}

export type RequestResponse = {
  id: string;
  created_at: string;
  payload: Record<string, string>;
};

export function responseCompany(row: RequestResponse) {
  return String(row.payload.company ?? "").trim();
}

export async function loadRequestResponses(
  company?: RequestCompany,
): Promise<RequestResponse[]> {
  const local = (): RequestResponse[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = JSON.parse(window.localStorage.getItem(RESPONSES_KEY) ?? "[]") as Array<
        Record<string, unknown>
      >;
      return raw.map(normalizeResponse);
    } catch {
      return [];
    }
  };

  let rows: RequestResponse[] | null = null;
  try {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      let query = supabase
        .from("recruitment_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (company) query = query.eq("company", company);
      const { data, error } = await query;
      if (!error && data) rows = data.map(normalizeResponse);
    }
  } catch {
    /* local */
  }

  if (!rows) rows = local();
  if (company) {
    return rows.filter((row) => responseCompany(row) === company);
  }
  return rows;
}

function normalizeResponse(row: Record<string, unknown>): RequestResponse {
  let payload =
    row.payload && typeof row.payload === "object"
      ? (row.payload as Record<string, string>)
      : Object.fromEntries(
          Object.entries(row)
            .filter(([, value]) => typeof value === "string" || typeof value === "number")
            .map(([key, value]) => [key, String(value ?? "")]),
        );

  if (!payload.company && typeof row.company === "string") {
    payload = { ...payload, company: row.company };
  }

  return {
    id: String(row.id ?? crypto.randomUUID()),
    created_at: String(row.created_at ?? new Date().toISOString()),
    payload,
  };
}

export function persistLocalResponse(row: RequestResponse) {
  const current = JSON.parse(window.localStorage.getItem(RESPONSES_KEY) ?? "[]") as unknown[];
  window.localStorage.setItem(RESPONSES_KEY, JSON.stringify([row, ...current]));
}
