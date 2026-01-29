export interface Employee {
  id: number | null;
  email: string;
  name: string;
  companyName: string;
  employmentStatus: number;
  isDeleted: boolean;
  tenantId: number | null;
  password?: string;
}
