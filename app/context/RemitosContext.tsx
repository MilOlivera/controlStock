"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import { db, storage } from "../lib/firebase";

/* ---------- TIPOS ---------- */

export type Remito = {
  firestoreId?: string;
  location: string;
  fecha: Date;
  nroRemito: string;
  latasMedialunas: number;
  unidadesMedialunas: number;
  latasTrenzas: number;
  unidadesTrenzas: number;
  esRefuerzo?: boolean;
  fotoUrl?: string;
  fotoPath?: string;
  observacion?: string;
  creadoPor: string;
  createdAt: Date;
};

export type Cierre = {
  firestoreId?: string;
  location: string;
  fecha: Date;
  medParaDevolver: number;
  medRellenaDesecho: number;
  trenzasSobrantes: number;
  latasCrudasQuedan: number;
  observacion?: string;
  creadoPor: string;
  createdAt: Date;
};

export type ConfirmacionDevolucion = {
  firestoreId?: string;
  location: string;
  fecha: Date;
  medReconocidas: number;
  observacion?: string;
  creadoPor: string;
  createdAt: Date;
};

type RemitosContextType = {
  remitos: Remito[];
  cierres: Cierre[];
  confirmaciones: ConfirmacionDevolucion[];
  addRemito: (
    data: Omit<Remito, "firestoreId" | "createdAt">,
    foto?: File,
    setProgress?: (n: number) => void
  ) => Promise<void>;
  addCierre: (
    data: Omit<Cierre, "firestoreId" | "createdAt">
  ) => Promise<void>;
  addConfirmacionDevolucion: (
    data: Omit<ConfirmacionDevolucion, "firestoreId" | "createdAt">
  ) => Promise<void>;
  getRemitoByDate: (location: string, fecha: Date) => Remito | undefined;
  getCierreByDate: (location: string, fecha: Date) => Cierre | undefined;
  getConfirmacionByDate: (location: string, fecha: Date) => ConfirmacionDevolucion | undefined;
  getRemitosDelDia: (location: string, fecha: Date) => Remito[];
};

const RemitosContext = createContext<RemitosContextType | null>(null);

/* ---------- HELPER ---------- */

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ---------- PROVIDER ---------- */

export function RemitosProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [remitos, setRemitos] = useState<Remito[]>([]);
  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [confirmaciones, setConfirmaciones] = useState<ConfirmacionDevolucion[]>([]);

  /* LISTENER REMITOS */
  useEffect(() => {
    const q = query(collection(db, "remitos"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Remito[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          firestoreId: d.id,
          fecha: data.fecha?.toDate?.() ?? new Date(),
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        } as Remito;
      });
      setRemitos(list);
    });
    return () => unsub();
  }, []);

  /* LISTENER CIERRES */
  useEffect(() => {
    const q = query(collection(db, "cierres"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Cierre[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          firestoreId: d.id,
          fecha: data.fecha?.toDate?.() ?? new Date(),
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        } as Cierre;
      });
      setCierres(list);
    });
    return () => unsub();
  }, []);

  /* LISTENER CONFIRMACIONES */
  useEffect(() => {
    const q = query(collection(db, "confirmaciones"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: ConfirmacionDevolucion[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          firestoreId: d.id,
          fecha: data.fecha?.toDate?.() ?? new Date(),
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        } as ConfirmacionDevolucion;
      });
      setConfirmaciones(list);
    });
    return () => unsub();
  }, []);

  /* GETTERS */
  function getRemitoByDate(location: string, fecha: Date) {
    return remitos.find(
      (r) => r.location === location && isSameDay(r.fecha, fecha) && !r.esRefuerzo
    );
  }

  function getRemitosDelDia(location: string, fecha: Date) {
    return remitos.filter(
      (r) => r.location === location && isSameDay(r.fecha, fecha)
    );
  }

  function getCierreByDate(location: string, fecha: Date) {
    return cierres.find(
      (c) => c.location === location && isSameDay(c.fecha, fecha)
    );
  }

  function getConfirmacionByDate(location: string, fecha: Date) {
    return confirmaciones.find(
      (c) => c.location === location && isSameDay(c.fecha, fecha)
    );
  }

  /* ADD REMITO */
  async function addRemito(
    data: Omit<Remito, "firestoreId" | "createdAt">,
    foto?: File,
    setProgress?: (n: number) => void
  ) {
    let fotoUrl = "";
    let fotoPath = "";

    if (foto) {
      fotoPath = `remitos/${data.location}/${Date.now()}-${foto.name}`;
      const storageRef = ref(storage, fotoPath);
      const uploadTask = uploadBytesResumable(storageRef, foto);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if (setProgress) {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(Math.round(progress));
            }
          },
          reject,
          resolve
        );
      });

      fotoUrl = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "remitos"), {
      ...data,
      fotoUrl,
      fotoPath,
      fecha: Timestamp.fromDate(data.fecha),
      createdAt: Timestamp.now(),
    });
  }

  /* ADD CIERRE */
  async function addCierre(
    data: Omit<Cierre, "firestoreId" | "createdAt">
  ) {
    await addDoc(collection(db, "cierres"), {
      ...data,
      fecha: Timestamp.fromDate(data.fecha),
      createdAt: Timestamp.now(),
    });
  }

  /* ADD CONFIRMACION */
  async function addConfirmacionDevolucion(
    data: Omit<ConfirmacionDevolucion, "firestoreId" | "createdAt">
  ) {
    await addDoc(collection(db, "confirmaciones"), {
      ...data,
      fecha: Timestamp.fromDate(data.fecha),
      createdAt: Timestamp.now(),
    });
  }

  return (
    <RemitosContext.Provider
      value={{
        remitos,
        cierres,
        confirmaciones,
        addRemito,
        addCierre,
        addConfirmacionDevolucion,
        getRemitoByDate,
        getCierreByDate,
        getConfirmacionByDate,
        getRemitosDelDia,
      }}
    >
      {children}
    </RemitosContext.Provider>
  );
}

export function useRemitos() {
  const ctx = useContext(RemitosContext);
  if (!ctx) throw new Error("RemitosContext missing");
  return ctx;
}