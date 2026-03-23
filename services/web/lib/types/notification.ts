export interface AppNotification {
  id: string;
  type: string;
  role: string;
  title: string;
  message: string;
  willId: string;
  willName: string;
  createdAt: string;
  read: boolean;
}

export interface HistoryNotification {
  id: string;
  type: string;
  willId: string;
  willName: string;
  read: boolean;
  createdAt: string;
}
