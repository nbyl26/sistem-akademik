import { db } from "@/firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  WhereFilterOp,
  Query,
  DocumentData,
} from "firebase/firestore";
import { AcademicYear } from "@/types/master";

/**
 * Fetch all documents from a Firestore collection with optional query constraints
 * @param collectionName - Name of the Firestore collection
 * @param queryConstraints - Optional array of query constraints [field, operator, value]
 * @returns Promise of array of documents with type T
 */
export async function getAllDocuments<T>(
  collectionName: string,
  queryConstraints?: [string, WhereFilterOp, any][]
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  let finalQuery: Query<DocumentData> = collectionRef;

  // Apply query constraints if provided
  if (queryConstraints && queryConstraints.length > 0) {
    queryConstraints.forEach((constraint) => {
      finalQuery = query(
        finalQuery,
        where(constraint[0], constraint[1], constraint[2])
      );
    });
  }

  const snapshot = await getDocs(finalQuery);
  const documents: T[] = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        uid: doc.id,
        ...(doc.data() as object),
      } as T)
  );

  return documents;
}

/**
 * Add a new document to a Firestore collection
 * @param collectionName - Name of the Firestore collection
 * @param data - Data to be added
 * @returns Promise of the document ID
 */
export async function addDocument(
  collectionName: string,
  data: any
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
}

/**
 * Update an existing document in a Firestore collection
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID to update
 * @param data - Partial data to update
 * @returns Promise<void>
 */
export async function updateDocument(
  collectionName: string,
  id: string,
  data: any
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, data);
}

/**
 * Delete a document from a Firestore collection
 * @param collectionName - Name of the Firestore collection
 * @param id - Document ID to delete
 * @returns Promise<void>
 */
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

/**
 * Get the currently active academic year
 * @returns Promise of AcademicYear or null if no active year found
 */
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
