import type { CompanySlug } from "./types";

export const REQUEST_COMPANIES = ["AERIS", "KIN", "FTI"] as const;

export const JOB_LEVELS = [
  "Internship",
  "Consultant/Freelancer (Office)",
  "Non-Staff A (DW On-Call)",
  "Non-Staff B (DW Regular)",
  "Staff/Admin",
  "Associate/Specialist",
  "Sr Associate/Sr Specialist",
  "Supervisor/Lead",
  "Junior Manager",
  "Manager",
  "Senior Manager",
  "Head",
  "VP/Senior VP",
  "Director / C-level",
] as const;

export const WORKFORCE_TYPES = [
  "Internship",
  "Consultant/Freelancer (Office)",
  "Non-Staff A (DW On-Call)",
  "Non-Staff B (DW Regular)",
  "Contract (PKWT)",
  "Probation - Permanent (PKWTT)",
] as const;

export const DIVISIONS = [
  { value: "MGMT", label: "MGMT - Management" },
  { value: "FAT", label: "FAT - Finance Accounting Tax" },
  { value: "HRGA", label: "HRGA - Human Resources & General Affairs" },
  { value: "OPS", label: "OPS - Operations" },
  { value: "RD", label: "RD - Research & Development" },
  { value: "MKT", label: "MKT - Marketing" },
  { value: "COMM", label: "COMM - Commercial" },
] as const;

export const DEPARTMENTS: Record<string, string[]> = {
  MGMT: ["Executive Office", "PMO", "Legal & Compliance"],
  FAT: ["Finance", "Accounting", "Tax"],
  HRGA: ["Human Resources", "General Affairs", "IT"],
  OPS: ["Warehouse", "Production", "Supply Chain", "Retail Operations"],
  RD: ["Formulation", "Quality", "Packaging Development"],
  MKT: ["Brand", "Digital Marketing", "Content"],
  COMM: ["Sales", "E-commerce", "Key Account"],
};

export const WORK_LOCATIONS = [
  "Head Office (HO)",
  "Warehouse (WH)",
  "Remote",
] as const;

export const HEADCOUNT_TYPES = ["New Hire", "Replacement"] as const;

export const COST_CENTERS = [
  "AERIS",
  "AERIS - Shared",
  "KIN",
  "FTI",
  "FTI - Shared",
] as const;

export const PRIORITY_LEVELS = [
  { value: "P0", label: "P0 – Critical / Immediate" },
  { value: "P1", label: "P1 – High Priority" },
  { value: "P2", label: "P2 – Medium Priority" },
  { value: "P3", label: "P3 – Low Priority / Future Need (Pipeline)" },
] as const;

export type RecruitmentRequest = {
  id: string;
  company: string;
  job_position: string;
  min_job_level: string;
  max_job_level: string;
  workforce_type: string;
  division: string;
  department: string;
  work_location: string;
  headcount_number: number;
  headcount_type: string;
  employee_replaced: string;
  cost_center: string;
  min_salary: string;
  max_salary: string;
  priority_level: string;
  expected_join_date: string;
  direct_supervisor: string;
  indirect_supervisor: string;
  job_description: string;
  additional_notes: string;
  assessment: string;
  interviewers: string;
  created_at: string;
};

export type RequestFormValues = Omit<RecruitmentRequest, "id" | "created_at" | "headcount_number"> & {
  headcount_number: string;
};

export type RequestField = keyof RequestFormValues;

export function defaultCompany(slug: CompanySlug) {
  return slug === "from-this-island" ? "FTI" : "AERIS";
}

export function emptyRequestForm(slug: CompanySlug): RequestFormValues {
  return {
    company: defaultCompany(slug),
    job_position: "",
    min_job_level: "",
    max_job_level: "",
    workforce_type: "",
    division: "",
    department: "",
    work_location: "",
    headcount_number: "",
    headcount_type: "",
    employee_replaced: "",
    cost_center: "",
    min_salary: "",
    max_salary: "",
    priority_level: "",
    expected_join_date: "",
    direct_supervisor: "",
    indirect_supervisor: "",
    job_description: "",
    additional_notes: "",
    assessment: "",
    interviewers: "",
  };
}

export function validateRequest(values: RequestFormValues) {
  const errors: Partial<Record<RequestField, string>> = {};
  const required: [RequestField, string][] = [
    ["company", "Company is required."],
    ["job_position", "Job Position is required."],
    ["min_job_level", "Min. Job Level is required."],
    ["max_job_level", "Max Job Level is required."],
    ["workforce_type", "Workforce type is required."],
    ["division", "Division is required."],
    ["department", "Department is required."],
    ["work_location", "Work Location is required."],
    ["headcount_number", "Headcount Number is required."],
    ["headcount_type", "Headcount Type is required."],
    ["cost_center", "Cost Center is required."],
    ["priority_level", "Priority Level is required."],
    ["expected_join_date", "Expected Join Date is required."],
    ["direct_supervisor", "Direct Supervisor (N+1) is required."],
    ["job_description", "Job Description is required."],
    ["interviewers", "Interviewers is required."],
  ];

  for (const [field, message] of required) {
    if (!String(values[field] ?? "").trim()) errors[field] = message;
  }

  const headcount = Number(values.headcount_number);
  if (values.headcount_number && (!Number.isFinite(headcount) || headcount < 1)) {
    errors.headcount_number = "Headcount Number must be at least 1.";
  }

  if (values.headcount_type === "Replacement" && !values.employee_replaced.trim()) {
    errors.employee_replaced = "Employee to be Replaced is required.";
  }

  return errors;
}

export function options(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}
