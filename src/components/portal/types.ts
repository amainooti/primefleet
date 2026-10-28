export type PortalFormValues = {
  contactName: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  dealerName: string;
  alertText: string;
  alertActionLabel: string;
  maintenanceNotes: string;
  vehicleTitle: string;
  vehicleStatus: string;
  stockNumber: string;
  vehicleColor: string;
  vin: string;
  engine: string;
  transmission: string;
  mileage: string;
  steps: { label: string; status: string }[];
  charges: { label: string; note: string; amount: string; status: string }[];
};

export const EMPTY_PORTAL_VALUES: PortalFormValues = {
  contactName: "",
  companyName: "",
  contactEmail: "",
  contactPhone: "",
  dealerName: "PrimeFleet Motors LLC",
  alertText: "",
  alertActionLabel: "Upload COI",
  maintenanceNotes: "",
  vehicleTitle: "",
  vehicleStatus: "Locked & Reserved",
  stockNumber: "",
  vehicleColor: "",
  vin: "",
  engine: "",
  transmission: "",
  mileage: "",
  steps: [
    { label: "Holding Deposit Initiated", status: "DONE" },
    { label: "Lease Agreement Signed", status: "DONE" },
    { label: "Pending Insurance (COI)", status: "PENDING" },
    { label: "IRP Reactivation", status: "TODO" },
    { label: "Final Yard Pickup", status: "TODO" },
  ],
  charges: [
    { label: "Initial Holding Deposit", note: "Paid via PNC RFP", amount: "1500", status: "PROCESSING" },
  ],
};
