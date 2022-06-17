import React, {useState, useRef, useContext} from 'react';
import {FirebaseContext} from "../firebaseContext";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    deleteDoc,
    updateDoc,
    addDoc,
    query,
    where
} from 'firebase/firestore';

const ImportData = () => {
    const firebaseApp = useContext(FirebaseContext);
    const [isShowImport, setShowImport] = useState(null);
    const [sites, setSites] = useState(null);
    const [error, setError] = useState(null);
    const textRef = useRef(null);

    const handleConvert = () => {
        try {
            const sitesObj = JSON.parse(textRef.current.value);
            if (!sitesObj.features) {
                setError('no features in geojson');
                return;
            }

            const sitesPromises = [];
            const sitesRef = collection(firebaseApp.db, 'survey_sites');
            sitesObj.features.forEach(feature => {
                const sitePromise = addDoc(sitesRef, {
                    is_user_defined: false,
                    coordinates: JSON.stringify(feature.geometry.coordinates),
                    center: feature.properties.center,
                    name: feature.properties.name
                });
                sitesPromises.push(sitePromise);
            });
            Promise.all(sitesPromises).then(res => {
                setError(`Imported ${res.length} sites`);
            }, err => {
                setError(err.message);
            });
        } catch(e) {
            setError('Error parsing GeoJSON: ' + e.message);
        }
    };
    return <div>
        {!isShowImport ? <button className='link' onClick={() => setShowImport(true)}>Import Data</button> :
        <div style={{backgroundColor: 'white', padding: '10px',
            position: 'fixed', width: '60%', height: '60vh', top: '20vh', left: '20%', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', flexFlow: 'column'}}>
            {!!error && <div>{error}</div>}
            <h2>Import Sites Data</h2>
            <textarea ref={textRef} style={{width: '100%', minHeight: '50%'}} /><br/>
            <button type={'button'} onClick={handleConvert}>Convert</button>
            <button style={{position: 'absolute', top: 0, right: 0}}
                    className='link' onClick={() => setShowImport(false)}>close</button>
        </div>}
    </div>;
};

export default ImportData;