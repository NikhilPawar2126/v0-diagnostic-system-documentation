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
  // Get all patients without orderBy to avoid index requirement
  const snapshot = await getDocs(patientsRef)
  
  if (snapshot.empty) {
    return 'P001'
  }
  
  // Find the highest UID number
  const patients = snapshot.docs.map(doc => doc.data() as Patient)
  let maxNumber = 0
  patients.forEach(patient => {
    const num = parseInt(patient.uid.replace('P', ''), 10)
    if (num > maxNumber) {
      maxNumber = num
    }
  })
  
  const nextNumber = maxNumber + 1
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
  // Get all patients without orderBy to avoid index requirement
  const snapshot = await getDocs(patientsRef)
  
  const patients = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Patient))
  
  // Sort in memory by createdAt descending (newest first)
  return patients.sort((a, b) => {
    const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()
    const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()
    return timeB - timeA
  })
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
  // Use only where clause to avoid composite index requirement
  const q = query(scansRef, where('uid', '==', uid))
  const snapshot = await getDocs(q)
  
  // Sort in memory instead of Firestore to avoid index requirement
  const scans = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Scan))
  
  // Sort by timestamp descending (newest first)
  return scans.sort((a, b) => {
    const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : new Date(a.timestamp).getTime()
    const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : new Date(b.timestamp).getTime()
    return timeB - timeA
  })
}

export { db }
