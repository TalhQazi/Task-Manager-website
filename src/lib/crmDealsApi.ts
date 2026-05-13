import { apiFetch } from "@/lib/admin/apiClient";

export interface CRMDeal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: "Qualification" | "Needs Analysis" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
  probability: number;
  closeDate: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCRMDealData {
  name: string;
  company: string;
  value: number;
  stage?: "Qualification" | "Needs Analysis" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
  probability?: number;
  closeDate: string;
  owner?: string;
}

export interface UpdateCRMDealData extends Partial<CreateCRMDealData> {}

export interface CRMDealsResponse {
  items: CRMDeal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  metrics?: {
    totalValue: number;
    weightedValue: number;
    wonDeals: number;
    activeDeals: number;
  };
}

export interface CRMDealsQuery {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  owner?: string;
}

export const crmDealsApi = {
  list: (query?: CRMDealsQuery): Promise<CRMDealsResponse> =>
    apiFetch<CRMDealsResponse>("/api/crm-deals", { query }),

  create: (data: CreateCRMDealData): Promise<{ item: CRMDeal }> =>
    apiFetch<{ item: CRMDeal }>("/api/crm-deals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateCRMDealData): Promise<{ item: CRMDeal }> =>
    apiFetch<{ item: CRMDeal }>(`/api/crm-deals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ message: string }> =>
    apiFetch<{ message: string }>(`/api/crm-deals/${id}`, {
      method: "DELETE",
    }),
};