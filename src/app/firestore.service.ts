import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDocs,
  query as fsQuery,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  CollectionReference,
  DocumentReference,
  Query,
  QueryConstraint,
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private fs: Firestore = inject(Firestore);

  collection(path: string): CollectionReference {
    return collection(this.fs, path);
  }

  doc(path: string, ...segments: string[]): DocumentReference {
    return doc(this.fs, path, ...segments);
  }

  query(ref: CollectionReference | Query, ...constraints: QueryConstraint[]): Query {
    return fsQuery(ref, ...constraints);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
    return orderBy(field, direction);
  }

  limit(n: number): QueryConstraint {
    return limit(n);
  }

  addDoc(ref: CollectionReference, data: Record<string, any>): Promise<DocumentReference> {
    return addDoc(ref, data);
  }

  getDocs(q: Query | CollectionReference): Promise<any> {
    return getDocs(q as any);
  }

  runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return runTransaction(this.fs, fn);
  }

  serverTimestamp(): any {
    return serverTimestamp();
  }

  onSnapshot(ref: DocumentReference, callback: (snap: any) => void): () => void {
    return onSnapshot(ref, callback);
  }
}
