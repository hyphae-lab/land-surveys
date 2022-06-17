import {connectAuthEmulator} from "firebase/auth";
import {connectFirestoreEmulator} from "firebase/firestore";

export default (firebaseApp) => {
    connectAuthEmulator(firebaseApp.auth, "http://localhost:9099");
    connectFirestoreEmulator(firebaseApp.db, 'localhost', 8080);
};
