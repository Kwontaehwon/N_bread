import { users } from '@prisma/client';

interface dealImage {
  id: number;
  dealImage: string;
}
interface user {
  nick: string;
  curLocation3: string;
}

export interface mypageDto {
  id: number;
  title: string;
  link: string;
  totalPrice: number;
  personalPrice: number;
  currentMember: number;
  totalMember: number;
  dealDate: Date;
  dealPlace: string;
  content: string;
  loc1: string;
  loc2: string;
  loc3: string;
  isCertificated: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  userId: number;
  mystatus?: string;
  status?: string;
  users?: user;
  dealImages?: dealImage[];
}
