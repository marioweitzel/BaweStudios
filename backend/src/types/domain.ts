export type HostWaitResult = { text: string | null; retry: boolean };

export type StoredUser = { id: string; email: string; name: string; hash: string; workspace_user_id?: string };

export type StoredProject = {
  id: string;
  project_id: string;
  userId: string;
  user_id: string;
  chat_history_id?: string;
  name: string;
  project_name: string;
  project_path: string;
  description: string;
  type: string;
  status: 'building' | 'ready' | 'failed' | 'pending';
  previewUrl: string;
  zipUrl: string;
  createdAt: string;
  updatedAt: string;
  created_at: string;
  updated_at: string;
};

export type StoredChatMessage = {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  visible: boolean;
  event_type?: string;
  attachment?: StoredChatAttachment;
};

export type StoredChatAttachment = {
  type: 'image';
  filename: string;
  mime: string;
  projectPath: string;
  url: string;
};

export type StoredChatHistory = {
  id: string;
  userId: string;
  user_id: string;
  projectId: string | null;
  project_id: string | null;
  hostSessionId: string | null;
  status: 'interview_started' | 'project_linked' | 'closed' | 'failed';
  messages: StoredChatMessage[];
  pending_question?: StoredChatMessage | null;
  pending_answer?: StoredChatMessage | null;
  createdAt: string;
  updatedAt: string;
  created_at: string;
  updated_at: string;
};

export type DbShape = { users: StoredUser[]; projects: StoredProject[]; chatHistories: StoredChatHistory[] };

export type ProjectState =
  | 'NEW_PROJECT'
  | 'INTERVIEW_NOT_COMPLETED'
  | 'PROJECT_BUILDING'
  | 'PROJECT_FINISHED';

export type ExecutionState = 'IDLE' | 'RUNNING' | 'STOPPING' | 'STOPPED';

export type HostJobStatus =
  | 'running'
  | 'running_waiting'
  | 'rate_limited'
  | 'partial_completed'
  | 'final_contract_received'
  | 'delivery_ready'
  | 'delivery_failed'
  | 'failed'
  | 'edit_running'
  | 'edit_running_waiting'
  | 'edit_rate_limited'
  | 'edit_partial_completed'
  | 'edit_final_received'
  | 'edit_done'
  | 'edit_failed';

export type DeliveryPackage = {
  status?: string;
  zip_path?: string;
  zip_encrypted?: boolean;
  password_file?: string;
  encryption?: {
    enabled?: boolean;
    method?: string;
    password_delivery?: string;
  };
  preview?: {
    type?: string;
    url?: string;
  };
};

export type DeliveryInfo = {
  packagePath: string;
  zipPath: string;
  zipPathRelative: string;
  passwordFilePath: string;
  zipPassword: string;
  previewUrl: string;
  zipEncrypted: boolean;
  warning: string;
};

export type ProjectStateView = {
  project_state: ProjectState;
  execution_state: ExecutionState;
  state: ProjectState;
  headerLabel: string;
  centralTitle: string;
  centralText: string;
  inputDisabled: boolean;
  showStop: boolean;
  canAcceptInput: boolean;
  temporaryMessage?: string;
};
