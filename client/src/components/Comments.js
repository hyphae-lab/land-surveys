import React, {useRef, useState, useEffect, useContext} from 'react';
import {FirebaseContext} from "./firebaseContext";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query, updateDoc,
    where
} from "firebase/firestore";


const surveyCommentsCollection = 'survey_comments';

const Comments = ({site, comments, onCommentAdded, onCommentRemoved}) => {
    const firebaseApp = useContext(FirebaseContext);
    const [isAddNew, setAddNew] = useState(false);

    const handleAddNewClick = () => {
        setAddNew(true);
    };

    const handleCancelNewClick = () => {
        commentRef.current.value = '';
        setAddNew(false);
    };

    const commentRef = useRef(null);
    const handleSaveNewClick = () => {
        addComment({
            text: commentRef.current.value,
            is_anon: true,
            user_id: '',
            site_id: site.id,
            time_written: new Date()
        });
    };

    const addComment = (comment) => {
        addDoc(collection(firebaseApp.db, surveyCommentsCollection), comment).then(docRef => {
            comment.id = docRef.id;
            handleCancelNewClick();
            onCommentAdded(comment);
        }).catch(e => {
            console.error("Error adding comment", e);
        }).finally(() => {
        });
    }

    const deleteComment = (id, e) => {
        e.preventDefault();

        if (!window.confirm(`Are you certain you want to delete comment?`)) {
            return;
        }

        deleteDoc(doc(firebaseApp.db, surveyCommentsCollection, id))
            .then(() => {
                onCommentRemoved(id);
            })
            .catch((error) => {
                console.log('Error deleting comment', error);
            })
            .finally(() => {

            })
    }

    const updateComment = (comment) => {
        const docRef = doc(firebaseApp.db, surveyCommentsCollection, comment.id);
        updateDoc(docRef, comment)
            .then(response => {
                const comments_ = [...comments];
                comments_[comments_.findIndex(a => a.id === comment.id)] = comment;
            })
            .catch(error => {
                console.log('comment update error ', error.message);
            });
    }

    return <div>
        {!comments || !comments.length ?
            <div>no comments</div> :
            comments.map(comment => <div key={comment.id}>
                ({comment.is_anon ? 'Anonymous' : 'User'} on {comment.time_written.toLocaleString()}):<br/>
                {comment.text}
            </div>)
        }
        {!isAddNew ?
            <div>
                <button type='button' className='link' onClick={handleAddNewClick}>add new</button>
            </div> :
            <div>
                <h3>New Comment</h3>
                <textarea ref={commentRef}></textarea><br/>
                <button type='button' className='link' onClick={handleSaveNewClick}>save</button>
                <button type='button' className='link' onClick={handleCancelNewClick}>cancel</button>
            </div>
        }
    </div>;
};

export default Comments;