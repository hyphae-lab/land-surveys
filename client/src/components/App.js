import React, {useState, useEffect, useRef} from 'react';
import envType from '../../keys/env';

import {FirebaseContext} from "./firebaseContext";
import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from 'firebase/firestore';
import firebaseConfig from "../../keys/firebase-config";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const firebaseApp = {db, auth, showAuth: window.location.search.indexOf('admin') >= 0, env: envType};

// import firebaseDevSetup from "./dev/firebaseDevSetup"; // dev
import firebaseDevSetup from "./dev/emptyFn"; // prod
firebaseDevSetup(firebaseApp);

import Survey from './Survey';
import AuthUI from "./AuthUI";

import './style.css';

const App = () => {
    const [showAuth] = useState(firebaseApp.showAuth);
    return <FirebaseContext.Provider value={firebaseApp}>
        <div className='app'>
            {showAuth && <AuthUI />}
            <main>
                <Survey />
            </main>
        </div>
    </FirebaseContext.Provider>;
};

export default App;