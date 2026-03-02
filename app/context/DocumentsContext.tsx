"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { db, storage } from "../lib/firebase";

/* ---------- TIPOS ---------- */

export type DocumentType =
  | "Remito"
  | "Factura"
  | "Comprobante"
  | "Ticket"
  | "Otro";

export type DocumentItem = {
  firestoreId?: string;
  location: string;
  type: DocumentType;
  number: string;
  observation?: string;
  fileUrl: string;
  filePath: string;
  fileType?: string;
  date: Date;
  createdAt: Date;
};

/* ---------- CONTEXTO ---------- */

type DocumentsContextType = {
  documents: DocumentItem[];

  uploadDocument: (
    location: string,
    type: DocumentType,
    number: string,
    date: Date,
    file: File,
    observation?: string,
    setProgress?: (n: number) => void
  ) => Promise<void>;

  deleteDocument: (docId: string, filePath: string) => Promise<void>;
};

const DocumentsContext =
  createContext<DocumentsContextType | null>(null);

/* ---------- PROVIDER ---------- */

export function DocumentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  /* ---------- AUTO CLEAN 30 DIAS ---------- */

  async function cleanupOldDocuments(list: DocumentItem[]) {
    const now = Date.now();
    const THIRTY_DAYS =
      1000 * 60 * 60 * 24 * 30;

    for (const d of list) {
      if (!d.createdAt) continue;

      const age = now - new Date(d.createdAt).getTime();

      if (age > THIRTY_DAYS) {
        try {
          if (d.firestoreId) {
            await deleteDoc(
              doc(db, "documents", d.firestoreId)
            );
          }

          if (d.filePath) {
            const fileRef = ref(storage, d.filePath);
            await deleteObject(fileRef);
          }

          console.log(
            "Documento eliminado por antigüedad:",
            d.number
          );
        } catch (err) {
          console.error(
            "Error limpiando documento viejo",
            err
          );
        }
      }
    }
  }

  /* ---------- LISTENER ---------- */

  useEffect(() => {
    const q = query(
      collection(db, "documents"),
      orderBy("date", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: DocumentItem[] = snapshot.docs.map((d) => {
        const data = d.data();

        return {
          ...(data as any),
          firestoreId: d.id,
          date: data.date?.toDate?.() ?? new Date(),
          createdAt:
            data.createdAt?.toDate?.() ?? new Date(),
        };
      });

      setDocuments(list);

      /* limpieza automática */
      cleanupOldDocuments(list);
    });

    return () => unsub();
  }, []);

  /* ---------- SUBIR DOCUMENTO ---------- */

  async function uploadDocument(
    location: string,
    type: DocumentType,
    number: string,
    date: Date,
    file: File,
    observation?: string,
    setProgress?: (n: number) => void
  ) {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo supera los 10MB");
      return;
    }

    const filePath = `documents/${location}/${Date.now()}-${file.name}`;

    const storageRef = ref(storage, filePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (setProgress) {
            const progress =
              (snapshot.bytesTransferred /
                snapshot.totalBytes) *
              100;

            setProgress(Math.round(progress));
          }
        },
        reject,
        resolve
      );
    });

    const fileUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, "documents"), {
      location,
      type,
      number,
      observation: observation || "",
      fileUrl,
      filePath,
      fileType: file.type,
      date: Timestamp.fromDate(date),
      createdAt: Timestamp.now(),
    });
  }

  /* ---------- BORRAR DOCUMENTO ---------- */

  async function deleteDocument(
    docId: string,
    filePath: string
  ) {
    try {
      await deleteDoc(doc(db, "documents", docId));

      if (filePath) {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }
    } catch (err) {
      console.error("Error borrando documento", err);
    }
  }

  return (
    <DocumentsContext.Provider
      value={{
        documents,
        uploadDocument,
        deleteDocument,
      }}
    >
      {children}
    </DocumentsContext.Provider>
  );
}

/* ---------- HOOK ---------- */

export function useDocuments() {
  const ctx = useContext(DocumentsContext);

  if (!ctx) {
    throw new Error("DocumentsContext missing");
  }

  return ctx;
}