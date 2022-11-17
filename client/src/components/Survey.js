import React, { useRef, useState, useEffect, useContext } from 'react';
import Map from "./Map";
import Popup from './Popup';
import Comments from "./Comments";
import NewSite from "./NewSite";
// import ImportData from "./dev/ImportData"; // dev
import ImportData from "./dev/Empty"; // prod

import {FirebaseContext} from "./firebaseContext";
import {
    collection,
    doc,
    getDocs,
    // getDoc,
    // deleteDoc,
    updateDoc,
    addDoc,
    // query,
    // where
} from 'firebase/firestore';

import {onAuthStateChanged} from "firebase/auth";

const surveySitesCollection = 'survey_sites';
const surveyCommentsCollection = 'survey_comments';

const Survey = () => {
    const firebaseApp = useContext(FirebaseContext);

    const [authUser, setAuthUser] = useState(null);
    useEffect(() => {
        // returning the unsubscribe function for "unmount" handler to run when unmoutingin component
        return onAuthStateChanged(firebaseApp.auth, user => {
            setAuthUser(user);
        });
    }, []);

    const [isLoading, setLoading] = useState(false);
    const [sites, setSites] = useState(null);
    const [comments, setComments] = useState(null);
    const [error, setError] = useState(false);
    const [currentSite, setCurrentSite] = useState(false);
    const [isCurrentSiteNew, setCurrentSiteNew] = useState(false);
    const [currentSiteComments, setCurrentSiteComments] = useState(false);

    const getSitesAndComments = () => {
        setLoading(true);

        const sitesPromise = getDocs(collection(firebaseApp.db, surveySitesCollection))
        .then(querySnapshot => {
            setError(false);
            let sites_ = {};
            querySnapshot.forEach((doc) => {
                let site = doc.data();
                site.id = doc.id;
                sites_[site.id] = site;
            });
            return sites_;
        })


        const commentsPromise = getDocs(collection(firebaseApp.db, surveyCommentsCollection))
            .then(querySnapshot => {
                let commentsBySiteId = {};
                querySnapshot.forEach((doc) => {
                    let comment = doc.data();
                    if (!commentsBySiteId[comment.site_id]) {
                        commentsBySiteId[comment.site_id] = [];
                    }
                    comment.id = doc.id;
                    comment.time_written = comment.time_written.toDate();
                    commentsBySiteId[comment.site_id].push(comment);
                });
                Object.values(commentsBySiteId).forEach(arr => {
                    arr.sort((a,b)=>{ return a.time_written < b.time_written ? -1 : 1; });
                });

                return commentsBySiteId;
            });

        Promise.all([sitesPromise, commentsPromise]).then(results => {
            const [sitesById, commentsBySiteId] = results;
            Object.values(sitesById).forEach(site => {
                site.comment_count = commentsBySiteId[site.id] ? commentsBySiteId[site.id].length : 0;
            });
            setComments(commentsBySiteId);
            setSites(sitesById);
        }).catch(error => {
            setError((error.message));
        }).finally(() => {
            setLoading(false);
        });
    };

    const updateSite = (site) => {
        const docRef = doc(firebaseApp.db, surveySitesCollection, site.id);
        updateDoc(docRef, site)
            .then(response => {
                setError(false)
            })
            .catch(error => {
                setError('Site update error ' + error.message);
            });
    }
    const addNewSite = (site) => {
        addDoc(collection(firebaseApp.db, surveySitesCollection), site)
            .then(docRef => {
                setError(false);
                site.id = docRef.id;
                site.comment_count = 0;
                setSites({...sites, [site.id]: site});
                setCurrentSiteNew(false);
                setCurrentSite(site);
                setIsAddNewSite(false);
            })
            .catch(error => {
                setError('Site update error ' + error.message);
            });
    }

    const [isAddNewSite, setIsAddNewSite] = useState(false); //
    // use a number for the "reset" flag so that we can trigger force-resets
    //  to child components listening for changes to that floag
    const [isAddNewSiteReset, setIsAddNewSiteReset] = useState(0); //
    const cancelNewSite = () => {
        setIsAddNewSite(false);
        setIsAddNewSiteReset(s => s+1);
    };

    const restartNewSite = () => {
        setIsAddNewSiteReset(s => s+1);
    };

    const handleSiteSelected = (siteId, coordinates=null) => {
        if (!siteId) {
            setCurrentSite(false);
        } else {
            if (siteId === 'new') {
                setCurrentSiteNew(true);
                setCurrentSite({is_user_defined: true, center: JSON.stringify([coordinates.lng, coordinates.lat])});
                setCurrentSiteComments(false);
            } else {
                setCurrentSiteNew(false);
                setCurrentSite(sites[siteId]);
                setCurrentSiteComments(comments[siteId]);
            }
        }
    };

    const handleCommentAdded = comment => {
        // update comment_count for site
        sites[comment.site_id].comment_count++;
        setSites({...sites});

        if (!comments[comment.site_id]) {
            comments[comment.site_id] = [comment];
            setCurrentSiteComments(comments[comment.site_id]);
        } else {
            comments[comment.site_id].push(comment);
        }

        setComments({...comments});

    };

    const handleCommentRemoved = site => {
        // update comment_count for site
    };

    useEffect(() => {
        getSitesAndComments();
    }, []);

    return <div>
        {isLoading && <div className='spinning-loader'></div>}
        {!!error && <div>{error}</div>}
        {firebaseApp.showAuth && authUser && <ImportData />}
        <div style={{width: '100%', height: '90vh', position: 'relative'}}>
            {sites && <React.Fragment>
                <div style={{position: 'absolute', top: 5, left: 5, zIndex: 1000}}>
                    <button type={'button'} onClick={() => setIsAddNewSite(s => !s)} className='link cta'>
                        {isAddNewSite ? '(x) cancel new site':'(+) add new site'}
                    </button>
                </div>
                <Map sites={sites} onSiteSelected={handleSiteSelected} isAddNewSite={isAddNewSite} isAddNewSiteReset={isAddNewSiteReset} />
            </React.Fragment>}
            {currentSite && !isCurrentSiteNew &&
                <Popup>
                    <Comments site={currentSite} comments={currentSiteComments} onCommentAdded={handleCommentAdded} onCommentRemoved={handleCommentRemoved}/>
                </Popup>}
            {currentSite && isCurrentSiteNew &&
                <Popup>
                    <NewSite add={addNewSite} restart={restartNewSite} cancel={cancelNewSite} site={currentSite} />
                </Popup>}
        </div>
    </div>
};

export default Survey;
