import { db } from "@/firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  WhereFilterOp,
  Query,
  DocumentData,
  orderBy, 
} from "firebase/firestore";
import { AcademicYear } from "@/types/master";

export async function getAllDocuments<T>(
  collectionName: string,
  queryConstraints?: [string, WhereFilterOp, any][]
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  let finalQuery: Query<DocumentData> = collectionRef;

  if (queryConstraints && queryConstraints.length > 0) {
    queryConstraints.forEach((constraint) => {
      finalQuery = query(
        finalQuery,
        where(constraint[0], constraint[1], constraint[2])
      );
    });
  }

  if (!queryConstraints || queryConstraints.length === 0) {
  }

  const snapshot = await getDocs(finalQuery);
  const documents: T[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...(doc.data() as object), 
      } as T)
  );
  return documents;
}

export async function addDocument(
  collectionName: string,
  data: any
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: any
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
}

export async function getActiveAcademicYear(): Promise<AcademicYear | null> {
  const q = query(
    collection(db, "academic_years"),
    where("isActive", "==", true)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const docData = snapshot.docs[0];
  return {
    id: docData.id,
    ...docData.data(),
  } as AcademicYear;
}
