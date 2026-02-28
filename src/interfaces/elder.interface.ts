export default interface CreateElderInput{
  name: string;
  cpf: string;
  age: number;
  emergencyContact?: string;
  birthData?: string;
  medicalConditions?: string[];
  medications?: string[];
  createLogin?: boolean;
  email?: string;
  password?: string;
  chiefId: string;
  bloodType?: string;
  allergies?: string[];
  phone?: string;
  observations?: string;
  address?: string

}