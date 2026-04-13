export interface LoginResponseDto {
  token: string;
  email: string;
  role: string;
}

export interface RegisterResponseDto {
  message: string;
  email: string;
}

export interface MeResponseDto {
  userId: number;
  email: string;
  name: string;
  role: string;
}
