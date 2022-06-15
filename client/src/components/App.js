import React, {useState, useEffect, useRef} from 'react';

import {FirebaseContext} from "./firebaseContext";
import {initializeApp} from "firebase/app";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {getFirestore} from 'firebase/firestore';
import firebaseConfig from "../../keys/firebase-config";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
//import {connectFirestoreEmulator } from 'firebase/firestore';
//connectFirestoreEmulator(db, 'localhost', 8080);
const db = getFirestore(app);
const firebaseApp = {db, auth};

import Survey from './Survey';
import AuthUI from "./AuthUI";

import './style.css';

const App = () => {
    const [authUser, setAuthUser] = useState(null);

    useEffect(() => {
        return onAuthStateChanged(auth, user => {
            // Check for user status
            setAuthUser(user);
        });
    }, []);

    useEffect(() => {
        return onAuthStateChanged(auth, user => {
            // Check for user status
            setAuthUser(user);
        });
    }, []);
    return <FirebaseContext.Provider value={firebaseApp}>
        <div className='app'>
            <h1>Opportunities for Green Infrastructure and Urban Greening in Bay Pointd</h1>
            <main>
                <Survey />
            </main>
        </div>
    </FirebaseContext.Provider>;
};

export default App;