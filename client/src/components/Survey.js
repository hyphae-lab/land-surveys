import React, { useRef, useState, useEffect, useContext } from 'react';
import Map from "./Map";
import Comments from "./Comments";
import NewSite from "./NewSite";
// import ImportData from "./dev/ImportData"; // dev
import ImportData from "./dev/Empty"; // prod

import {FirebaseContext} from "./firebaseContext";
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
    const [isCurrentSitenew, setCurrentSiteNew] = useState(false);
    const [currentSiteComments, setCurrentSiteComments] = useState(false);
    const [currentSiteClickPosition, setCurrentSiteClickPosition] = useState(false);
    const [currentSiteClickPositionDelta, setCurrentSiteClickPositionDelta] = useState(false);

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
            })
            .catch(error => {
                setError('Site update error ' + error.message);
            });
    }
    const cancelNewSite = () => {
        setCurrentSite(false);
        setCurrentSiteNew(false);
    };

    const handleSiteSelected = (siteId, clickPosition, coordinates=null) => {
        if (!siteId) {
            setCurrentSite(false);
            setCurrentSiteClickPosition(false);
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
            setCurrentSiteClickPosition(clickPosition);
        }
    };

    const handleMapMoved = (delta) => {
        setCurrentSiteClickPositionDelta(delta);
    };

    useEffect(() => {
        if (currentSite) {
            setCurrentSiteClickPosition({x: currentSiteClickPosition.x - currentSiteClickPositionDelta.x, y: currentSiteClickPosition.y - currentSiteClickPositionDelta.y});
        }
    }, [currentSiteClickPositionDelta]);

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
        <div style={{width: '90%', height: '90vh', position: 'relative'}}>
            {sites && <Map sites={sites} onSiteSelected={handleSiteSelected} onMapMove={handleMapMoved} />}
            {currentSite && !isCurrentSitenew &&
                <div style={{
                    position: 'absolute', backgroundColor: 'white', border: '1px solid grey',
                    maxHeight: '65%', overflowY: 'scroll',
                    top: (currentSiteClickPosition.y*1.1)+'px', left: currentSiteClickPosition.x+'px'
                }}>
                    <Comments site={currentSite} comments={currentSiteComments} onCommentAdded={handleCommentAdded} onCommentRemoved={handleCommentRemoved}/>
                </div>}
            {currentSite && isCurrentSitenew &&
                <React.Fragment>
                    <svg style={{
                        fill: 'magenta',
                        width: '40px',
                        position: 'absolute',
                        top: (currentSiteClickPosition.y-26)+'px', left: (currentSiteClickPosition.x-7)+'px',
                        }} viewBox="0 0 100 100">
                        <path d="M50,89.5c0.32,0,0.62-0.17,0.78-0.43c1.03-1.59,24.88-39.15,24.88-52.91C75.66,22.02,64.15,10.5,50,10.5  c-14.15,0-25.66,11.51-25.66,25.66c0,13.75,23.85,51.32,24.88,52.91C49.38,89.33,49.68,89.5,50,89.5z M33.46,36.16  c0-9.13,7.41-16.55,16.54-16.55c9.13,0,16.54,7.43,16.54,16.55c0,9.11-7.41,16.54-16.54,16.54C40.87,52.7,33.46,45.27,33.46,36.16z">
                        </path>
                    </svg>
                    <div style={{
                        position: 'absolute', backgroundColor: 'white', border: '1px solid grey',
                        maxHeight: '65%', overflowY: 'scroll',
                        top: (currentSiteClickPosition.y*1.1)+'px', left: currentSiteClickPosition.x+'px'
                        }}>
                        <NewSite add={addNewSite} cancel={cancelNewSite} site={currentSite} />
                    </div>
                </React.Fragment>}
        </div>
    </div>
};

export default Survey;
