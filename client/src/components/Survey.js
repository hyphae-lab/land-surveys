import React, { useRef, useState, useEffect, useContext } from 'react';
import Map from "./Map";
import Comments from "./Comments";

import {FirebaseContext} from "./firebaseContext";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    deleteDoc,
    updateDoc,
    query,
    where
} from 'firebase/firestore';

const surveySitesCollection = 'survey_sites';
const surveyCommentsCollection = 'survey_comments';

const Survey = () => {
    const firebaseApp = useContext(FirebaseContext);

    const [isLoading, setLoading] = useState(false);
    const [sites, setSites] = useState(null);
    const [comments, setComments] = useState(null);
    const [error, setError] = useState(false);
    const [currentSite, setCurrentSite] = useState(false);
    const [currentSiteComments, setCurrentSiteComments] = useState(false);
    const [currentSiteClickPosition, setCurrentSiteClickPosition] = useState(false);

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

    const handleSiteSelected = (siteId, position) => {
        if (!siteId) {
            setCurrentSite(false);
            setCurrentSiteClickPosition(false);
        } else {
            setCurrentSite(sites[siteId]);
            setCurrentSiteComments(comments[siteId]);
            setCurrentSiteClickPosition(position);
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
        <div style={{width: '90%', height: '90vh', position: 'relative'}}>
            {sites && <Map sites={sites} onSiteSelected={handleSiteSelected} />}
            {currentSite &&
                <div style={{
                    position: 'absolute', backgroundColor: 'white', border: '1px solid grey',
                    top: (currentSiteClickPosition.y*1.1)+'px', left: currentSiteClickPosition.x+'px'
                }}>
                    <Comments site={currentSite} comments={currentSiteComments} onCommentAdded={handleCommentAdded} onCommentRemoved={handleCommentRemoved}/>
                </div>}
        </div>
    </div>
};

export default Survey;
