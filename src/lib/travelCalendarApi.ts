import { apiClient } from "./apiClient";

export interface TravelCalendar {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  destination: string;
  purpose: "business" | "personal" | "conference" | "meeting" | "training" | "other";
  status: "planned" | "approved" | "in-progress" | "completed" | "cancelled";
  employee: {
    _id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  budget: {
    estimated: number;
    actual: number;
    currency: string;
  };
  attachments?: any[];
  notes?: string;
  visibility: "private" | "team" | "department" | "company";
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TravelCalendarCreateRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  destination: string;
  purpose?: "business" | "personal" | "conference" | "meeting" | "training" | "other";
  status?: "planned" | "approved" | "in-progress" | "completed" | "cancelled";
  budget?: {
    estimated?: number;
    actual?: number;
    currency?: string;
  };
  notes?: string;
  visibility?: "private" | "team" | "department" | "company";
}

export interface TravelCalendarUpdateRequest extends Partial<TravelCalendarCreateRequest> {}

export interface TravelCalendarFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  employee?: string;
  purpose?: string;
}

export interface TravelCalendarResponse {
  success: boolean;
  data: {
    items: TravelCalendar[];
    total: number;
  };
}

export interface TravelCalendarSingleResponse {
  success: boolean;
  data: {
    item: TravelCalendar;
  };
}

export interface TravelCalendarApiResponse {
  success: boolean;
  message?: string;
  data?: {
    item?: TravelCalendar;
  };
  error?: {
    message: string;
  };
}

class TravelCalendarApi {
  private baseUrl = "/api/travel-calendar";

  private parseErrorMessage(error: unknown): string {
    return error instanceof Error && error.message
      ? error.message
      : "Travel calendar feature not available";
  }

  // Get all travel calendars with optional filters
  async getTravelCalendars(filters?: TravelCalendarFilters): Promise<TravelCalendarResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await apiClient.get<TravelCalendarResponse>(`${this.baseUrl}?${params}`);
      return response.data;
    } catch (error) {
      console.warn("Travel calendar API not available, returning empty data");
      // Return empty data when API is not available
      return {
        success: true,
        data: {
          items: [],
          total: 0
        }
      };
    }
  }

  // Get single travel calendar by ID
  async getTravelCalendarById(id: string): Promise<TravelCalendarSingleResponse> {
    try {
      const response = await apiClient.get<TravelCalendarSingleResponse>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.warn("Travel calendar API not available for get by ID");
      throw new Error("Travel calendar not available");
    }
  }

  // Create new travel calendar
  async createTravelCalendar(data: TravelCalendarCreateRequest): Promise<TravelCalendarApiResponse> {
    try {
      const response = await apiClient.post<TravelCalendarApiResponse>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.warn("Travel calendar API not available for create");
      return {
        success: false,
        error: { message: this.parseErrorMessage(error) }
      };
    }
  }

  // Update travel calendar
  async updateTravelCalendar(id: string, data: TravelCalendarUpdateRequest): Promise<TravelCalendarApiResponse> {
    try {
      const response = await apiClient.put<TravelCalendarApiResponse>(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.warn("Travel calendar API not available for update");
      return {
        success: false,
        error: { message: this.parseErrorMessage(error) }
      };
    }
  }

  // Delete travel calendar
  async deleteTravelCalendar(id: string): Promise<TravelCalendarApiResponse> {
    try {
      const response = await apiClient.delete<TravelCalendarApiResponse>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.warn("Travel calendar API not available for delete");
      return {
        success: false,
        error: { message: this.parseErrorMessage(error) }
      };
    }
  }

  // Get travel statistics
  async getTravelStatistics(): Promise<any> {
    try {
      // This could be implemented later for dashboard widgets
      const response = await apiClient.get(`${this.baseUrl}/statistics`);
      return response.data;
    } catch (error) {
      console.warn("Travel calendar API not available for statistics");
      return null;
    }
  }
}

export const travelCalendarApi = new TravelCalendarApi();
