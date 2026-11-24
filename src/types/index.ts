export type ApplicationStatus =
  | 'WISHLIST'
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'GHOSTED';

export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO
  message: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  workMode: WorkMode;
  status: ApplicationStatus;
  requiredSkills: string[];
  cvVersion?: string;
  appliedDate?: string; // YYYY-MM-DD
  interviewDateTime?: string; // YYYY-MM-DDTHH:mm
  salaryOffer?: number;
  lastUpdatedAt: string; // ISO
  checklist: ChecklistItem[];
  activityLogs: ActivityLog[];
}

// Format 1 lowongan dari Remotive API & magang-fallback.json
export interface JobListing {
  id: number;
  title: string;
  company_name: string;
  category: string;
  candidate_required_location: string;
  salary: string;
  tags: string[];
}
