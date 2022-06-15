import React, {useState, useEffect, useRef, useContext} from 'react';
import {FirebaseContext} from "./firebaseContext";
import {onAuthStateChanged, signInWithEmailAndPassword, signOut} from "firebase/auth";

const authErrors = {
    'auth/invalid-email': 'email does not look right',
    'auth/user-not-found' : 'account does not exist',
    'auth/wrong-password' : 'try another password'
}
const AuthUI = () => {
    const firebaseApp = useContext(FirebaseContext);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // returning the unsubscribe function for "unmount" handler to run when unmoutingin component
        return onAuthStateChanged(firebaseApp.auth, authUser => {
            setUser(authUser);
        });
    }, []);

    const emailEl = useRef();
    const passEl = useRef();
    const loginHandler = e => {
        e.preventDefault();
        e.stopPropagation();

        setError(null);
        signInWithEmailAndPassword(firebaseApp.auth, emailEl.current.value, passEl.current.value)
            .catch(function (error) {
                // Handle Errors here.
                if (authErrors[error.code]) {
                    setError(authErrors[error.code]);
                } else {
                    setError(error.message);
                }
            });
    };

    const logoutHandler = () => {
        signOut(firebaseApp.auth);
    };

    return <div>
        {!!user ?
            <div>Logged in: {user.email} <button type='button' onClick={logoutHandler}>log out</button></div>
            :
            <form onSubmit={loginHandler}>
                <div><input placeholder='email' ref={emailEl}/></div>
                <div><input placeholder='pass' type='password' ref={passEl}/></div>
                <button type='submit' onClick={loginHandler}>log in</button>
                {!!error && <div>{error}</div>}
            </form>
        }
    </div>;
};

export default AuthUI;