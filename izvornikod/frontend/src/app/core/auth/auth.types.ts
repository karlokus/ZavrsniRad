export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export interface InstrumentRef {
  id: string;
  instrumentName: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  instrument?: InstrumentRef | null;
  skillLevel?: SkillLevel | null;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface SignUpDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  instrumentId?: string;
  skillLevel?: SkillLevel;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}
