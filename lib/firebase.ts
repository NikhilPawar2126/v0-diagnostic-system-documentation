import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, doc, updateDoc, Timestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if Firebase config is properly set
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId

if (!isConfigValid && typeof window !== 'undefined') {
  console.error("[v0] Firebase configuration is missing. Please add your Firebase environment variables.")
}

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

// Types
export interface Patient {
  id?: string
  uid: string
  name: string
  age: number
  gender: string
  dob: string
  doctor: string
  diagnosis: string
  reference: string
  mobile: string
  status: 'Active' | 'Inactive'
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface Scan {
  id?: string
  uid: string
  distance: number
  frequency: number
  chi: number
  temperature: number
  timestamp: Timestamp | Date
}

// Generate next patient UID
export async function generatePatientUID(): Promise<string> {
  const patientsRef = collection(db, 'patients')
  const q = query(patientsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return 'P001'
  }
  
  const patients = snapshot.docs.map(doc => doc.data() as Patient)
  const lastUID = patients[0]?.uid || 'P000'
  const lastNumber = parseInt(lastUID.replace('P', ''), 10)
  const nextNumber = lastNumber + 1
  return `P${nextNumber.toString().padStart(3, '0')}`
}

// Patient operations
export async function createPatient(patientData: Omit<Patient, 'id' | 'uid' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Patient> {
  const uid = await generatePatientUID()
  const now = Timestamp.now()
  
  const patient: Omit<Patient, 'id'> = {
    ...patientData,
    uid,
    status: 'Active',
    createdAt: now,
    updatedAt: now,
  }
  
  const docRef = await addDoc(collection(db, 'patients'), patient)
  return { ...patient, id: docRef.id }
}

export async function getPatients(): Promise<Patient[]> {
  const patientsRef = collection(db, 'patients')
  const q = query(patientsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Patient))
}

export async function updatePatientStatus(patientId: string, status: 'Active' | 'Inactive'): Promise<void> {
  const patientRef = doc(db, 'patients', patientId)
  await updateDoc(patientRef, { 
    status, 
    updatedAt: Timestamp.now() 
  })
}

// Scan operations
export async function saveScan(scanData: Omit<Scan, 'id' | 'timestamp'>): Promise<Scan> {
  const scan: Omit<Scan, 'id'> = {
    ...scanData,
    timestamp: Timestamp.now(),
  }
  
  const docRef = await addDoc(collection(db, 'scans'), scan)
  return { ...scan, id: docRef.id }
}

export async function getScansForPatient(uid: string): Promise<Scan[]> {
  const scansRef = collection(db, 'scans')
  const q = query(scansRef, where('uid', '==', uid), orderBy('timestamp', 'desc'))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Scan))
}

export { db }
