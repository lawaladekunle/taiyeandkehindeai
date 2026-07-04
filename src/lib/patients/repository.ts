/**
 * Patient repository — CRUD operations against the Prisma Patient model.
 */

import { PrismaClient, Patient } from "@prisma/client";

const prisma = new PrismaClient();

export type CreatePatientInput = {
  phoneNumber: string;
  name?: string;
  preferredName?: string;
  language?: string;
  timezone?: string;
};

export type UpdatePatientInput = Partial<Omit<CreatePatientInput, "phoneNumber">>;

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  return prisma.patient.create({ data: input });
}

export async function getPatientById(id: string): Promise<Patient | null> {
  return prisma.patient.findUnique({ where: { id } });
}

export async function getPatientByPhone(phoneNumber: string): Promise<Patient | null> {
  return prisma.patient.findUnique({ where: { phoneNumber } });
}

export async function upsertPatientByPhone(input: CreatePatientInput): Promise<Patient> {
  return prisma.patient.upsert({
    where: { phoneNumber: input.phoneNumber },
    create: input,
    update: {
      name: input.name,
      preferredName: input.preferredName,
      language: input.language,
      timezone: input.timezone,
    },
  });
}

export async function updatePatient(id: string, input: UpdatePatientInput): Promise<Patient> {
  return prisma.patient.update({ where: { id }, data: input });
}

export async function deletePatient(id: string): Promise<Patient> {
  return prisma.patient.delete({ where: { id } });
}

export async function listPatients(): Promise<Patient[]> {
  return prisma.patient.findMany({ orderBy: { createdAt: "desc" } });
}
