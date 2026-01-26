import { getFirestore } from "firebase/firestore";
import { firebaseApp } from "./firebase.ts";

export const db = getFirestore(firebaseApp);
