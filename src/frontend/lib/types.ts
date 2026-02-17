export interface EventDto {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
}

export interface CreateEventRequestDto {
  type: string;
  payload: unknown;
}
