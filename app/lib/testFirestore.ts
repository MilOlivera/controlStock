import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function testWrite() {
  await addDoc(collection(db, "test"), {
    message: "Firestore conectado",
    createdAt: new Date(),
  });

  console.log("Documento creado");
}
