/**
 * Inferred from all staff records and associations in the captured StaffFeedQuery.
 * This is not generated from the server GraphQL schema.
 * Null-only fields use unknown; empty arrays use unknown[] unless another
 * captured instance establishes the element type. Observed non-null fields
 * may still be nullable in other responses. Date values remain strings.
 * No employee values or credentials are included.
 */

export interface GeoHGraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

export interface GeoHStaffFeedResponse {
  data?: {
    staffFeed: GeoHStaffFeedContinuation | null;
  } | null;
  errors?: GeoHGraphQLError[];
  extensions?: Record<string, unknown>;
}

export interface GeoHStaffFeedContinuation {
  /** Only null observed; non-null type is unknown. */
  errors: unknown;
  staff: Array<GeoHStaff>;
  associations: GeoHStaffAssociations;
  /** Only null observed; non-null type is unknown. */
  continuation: unknown;
  __typename: "StaffFeedContinuation";
}

export interface GeoHStaff {
  id: string;
  color: null | string;
  /** Only null observed; non-null type is unknown. */
  image: unknown;
  firstName: string;
  middleName: null | string;
  lastName: string;
  fullName: string;
  displayName: string;
  /** Only null observed; non-null type is unknown. */
  deletedOn: unknown;
  __typename: "Staff";
  location: GeoHCoordinate | null;
  localization: GeoHLocalization | null;
  db: string;
  orgId: string;
  /** Only null observed; non-null type is unknown. */
  payerId: unknown;
  externalId: string | null;
  status: string;
  role: string;
  /** Only null observed; non-null type is unknown. */
  position: unknown;
  /** Only null observed; non-null type is unknown. */
  permissions: unknown;
  /** Only null observed; non-null type is unknown. */
  group: unknown;
  groups: Array<string>;
  /** Only null observed; non-null type is unknown. */
  notes: unknown;
  ssn: string | null;
  adpNumber: string | null;
  basePayRate: null | number;
  payrollCompanyId: null | string;
  weekdayStart: null | string;
  hireDate: string | null;
  dateOfBirth: string | null;
  createdOn: string;
  updatedOn: string;
  interfaces: Array<GeoHInterfaceStatus>;
  /** Only null observed; non-null type is unknown. */
  payrollUnits: unknown;
  phones: Array<GeoHPhone>;
  emails: Array<GeoHEmail>;
  addresses: Array<GeoHAddress>;
  /** Only null observed; non-null type is unknown. */
  sessionTypeConfig: unknown;
  tripTracking: GeoHTripTrackingConfig | null;
  /** Only null observed; non-null type is unknown. */
  isContractor: unknown;
  employmentType: null | string;
  fields: Array<unknown>;
  languages: Array<string> | null;
  /** Only null observed; non-null type is unknown. */
  employeePreferences: unknown;
  gender: string | null;
  defaultSignatureId: string | null;
  /** Only null observed; non-null type is unknown. */
  defaultEdiPartnerKey: unknown;
  /** Only null observed; non-null type is unknown. */
  defaultEdiTransmit: unknown;
  /** Only null observed; non-null type is unknown. */
  multipleVisitEnabled: unknown;
  /** Only null observed; non-null type is unknown. */
  selfSchedulingEnabled: unknown;
  /** Only null observed; non-null type is unknown. */
  cannotBeCaregiver: unknown;
  /** Only null observed; non-null type is unknown. */
  geohEmployee: unknown;
  /** Only null observed; non-null type is unknown. */
  selfSchedulingClientIds: unknown;
  /** Only null observed; non-null type is unknown. */
  timezone: unknown;
  /** Only null observed; non-null type is unknown. */
  assignedTo: unknown;
  tbTest: null | GeoHStaffCredential;
  driversLicenseRenewal: null | GeoHStaffCredential;
  /** Only null observed; non-null type is unknown. */
  employeeTraining: unknown;
  cprCertification: null | GeoHStaffCredential;
}

export interface GeoHCoordinate {
  latitude: number;
  longitude: number;
  ts: number;
  __typename: "Coordinate";
}

export interface GeoHLocalization {
  timezone: string;
  offset: number;
  locale: string;
  __typename: "Localization";
}

export interface GeoHInterfaceStatus {
  interfaceId: string;
  name: string;
  status: string;
  occurredOn: string;
  serviceConnectionId: string;
  /** Only null observed; non-null type is unknown. */
  errors: unknown;
  __typename: "InterfaceStatus";
}

export interface GeoHPhone {
  number: string;
  text: boolean;
  type: string | null;
  __typename: "Phone";
}

export interface GeoHEmail {
  address: string;
  type: string;
  __typename: "Email";
}

export interface GeoHAddress {
  /** Only null observed; non-null type is unknown. */
  name: unknown;
  line1: string;
  line2: null | string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  long: number;
  type: string;
  allowCorrection: boolean;
  /** Only null observed; non-null type is unknown. */
  source: unknown;
  /** Only null observed; non-null type is unknown. */
  addressType: unknown;
  __typename: "Address";
}

export interface GeoHTripTrackingConfig {
  /** Only null observed; non-null type is unknown. */
  enabled: unknown;
  /** Only null observed; non-null type is unknown. */
  payType: unknown;
  /** Only null observed; non-null type is unknown. */
  payRate: unknown;
  /** Only null observed; non-null type is unknown. */
  overtimeRate: unknown;
  /** Only null observed; non-null type is unknown. */
  mileageRate: unknown;
  __typename: "TripTrackingConfig";
}

export interface GeoHStaffCredential {
  /** Only null observed; non-null type is unknown. */
  key: unknown;
  type: string;
  /** Only null observed; non-null type is unknown. */
  id: unknown;
  issuedOn: string;
  expiresOn: string;
  reminderId: string;
  /** Only null observed; non-null type is unknown. */
  documentId: unknown;
  /** Only null observed; non-null type is unknown. */
  uploadRequired: unknown;
  __typename: "StaffCredential";
}

export interface GeoHStaffAssociations {
  companies: Array<GeoHCompany>;
  codes: Array<GeoHGenericCode>;
  __typename: "StaffAssociations";
}

export interface GeoHCompany {
  id: string;
  periodStart: string;
  periodDisabled: string;
  durationMonths: number;
  orgId: string;
  medicaidId: string;
  /** Only null observed; non-null type is unknown. */
  providerId: unknown;
  /** Only null observed; non-null type is unknown. */
  npi: unknown;
  ein: string;
  name: string;
  /** Only null observed; non-null type is unknown. */
  adpCompany: unknown;
  /** Only null observed; non-null type is unknown. */
  weekdayStart: unknown;
  gatewayPaymentProfileId: string;
  /** Only null observed; non-null type is unknown. */
  checkInEarlyMinutes: unknown;
  /** Only null observed; non-null type is unknown. */
  checkOutLateMinutes: unknown;
  multipleAddressCheckInEnabled: boolean;
  requiredVerificationParty: Array<string>;
  /** Only null observed; non-null type is unknown. */
  visitNoteRequired: unknown;
  /** Only null observed; non-null type is unknown. */
  clientGoalsRequired: unknown;
  disabledOn: string;
  clearedDebtOutcome: string;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  /** Only null observed; non-null type is unknown. */
  facilityNumber: unknown;
  /** Only null observed; non-null type is unknown. */
  cmsCertificationNumber: unknown;
  tripTracking: GeoHTripTracking;
  billing: GeoHCompanyBilling;
  package: GeoHCompanyPackage;
  contact: GeoHCompanyContact;
  /** Only null observed; non-null type is unknown. */
  groups: unknown;
  fields: GeoHFieldMetadataDefinition;
  /** Only null observed; non-null type is unknown. */
  oasisBranch: unknown;
  /** Only null observed; non-null type is unknown. */
  interfaces: unknown;
  /** Only null observed; non-null type is unknown. */
  periodPayroll: unknown;
  periodBilling: GeoHPeriodDefinition;
  features: Array<GeoHCompanyFeature>;
  quickbooksCustomer: GeoHQuickBooksCustomer;
  roles: Array<GeoHCompanyRole>;
  /** Only null observed; non-null type is unknown. */
  timezone: unknown;
  automationSettings: Array<unknown>;
  /** Only null observed; non-null type is unknown. */
  statusFlagConfig: unknown;
  __typename: "Company";
}

export interface GeoHTripTracking {
  /** Only null observed; non-null type is unknown. */
  enabled: unknown;
  /** Only null observed; non-null type is unknown. */
  billableOnly: unknown;
  /** Only null observed; non-null type is unknown. */
  payType: unknown;
  /** Only null observed; non-null type is unknown. */
  payRate: unknown;
  /** Only null observed; non-null type is unknown. */
  overtimeRate: unknown;
  /** Only null observed; non-null type is unknown. */
  mileageRate: unknown;
  /** Only null observed; non-null type is unknown. */
  type: unknown;
  /** Only null observed; non-null type is unknown. */
  minMileageApprovalThreshold: unknown;
  __typename: "TripTracking";
}

export interface GeoHCompanyBilling {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Only null observed; non-null type is unknown. */
  type: unknown;
  /** Only null observed; non-null type is unknown. */
  contractMonths: unknown;
  /** Only null observed; non-null type is unknown. */
  contractStartedOn: unknown;
  /** Only null observed; non-null type is unknown. */
  costPerUser: unknown;
  /** Only null observed; non-null type is unknown. */
  costPerClient: unknown;
  /** Only null observed; non-null type is unknown. */
  costPerHour: unknown;
  costMinimum: number;
  /** Only null observed; non-null type is unknown. */
  costBillingRate: unknown;
  /** Only null observed; non-null type is unknown. */
  credit: unknown;
  /** Only null observed; non-null type is unknown. */
  paymentType: unknown;
  address: GeoHAddress;
  /** Only null observed; non-null type is unknown. */
  owner: unknown;
  /** Only null observed; non-null type is unknown. */
  items: unknown;
  discounts: Array<unknown>;
  __typename: "CompanyBilling";
}

export interface GeoHCompanyPackage {
  type: string;
  __typename: "CompanyPackage";
}

export interface GeoHCompanyContact {
  firstName: string;
  lastName: string;
  email: string;
  /** Only null observed; non-null type is unknown. */
  fax: unknown;
  address: GeoHAddress;
  phone: string;
  __typename: "CompanyContact";
}

export interface GeoHFieldMetadataDefinition {
  /** Only null observed; non-null type is unknown. */
  client: unknown;
  /** Only null observed; non-null type is unknown. */
  session: unknown;
  /** Only null observed; non-null type is unknown. */
  staff: unknown;
  __typename: "FieldMetadataDefinition";
}

export interface GeoHPeriodDefinition {
  type: string;
  startDateUtc: string;
  duration: number;
  weekdayStart: string;
  __typename: "PeriodDefinition";
}

export interface GeoHCompanyFeature {
  key: string;
  levels: Array<string>;
  name: string;
  costType: string;
  /** Only null observed; non-null type is unknown. */
  costUnit: unknown;
  /** Only null observed; non-null type is unknown. */
  costUnitPrice: unknown;
  effectiveStart: null | string;
  /** Only null observed; non-null type is unknown. */
  effectiveEnd: unknown;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
  __typename: "CompanyFeature";
}

export interface GeoHQuickBooksCustomer {
  value: string;
  name: string;
  __typename: "QuickBooksCustomer";
}

export interface GeoHCompanyRole {
  key: string;
  name: string;
  description: string;
  system: null | boolean;
  assignable: Array<string>;
  permissions: Array<string>;
  __typename: "CompanyRole";
}

export interface GeoHGenericCode {
  id: string;
  type: string;
  key: string;
  name: string;
  /** Only null observed; non-null type is unknown. */
  description: unknown;
  /** Only null observed; non-null type is unknown. */
  relevance: unknown;
  /** Only null observed; non-null type is unknown. */
  jurisdiction: unknown;
  updatedOn: string;
  createdOn: string;
  /** Only null observed; non-null type is unknown. */
  features: unknown;
  __typename: "GenericCode";
}
