import React, {useRef} from 'react';

const surveyCommentsCollection = 'survey_comments';

const NewSite = ({add, restart, cancel, site}) => {
    const nameRef = useRef(null);
    const handleSaveClick = () => {
        add({
            ...site,
            name: nameRef.current.value
        });
    };

    const handleCancelClick = () => {
        nameRef.current.value = '';
        cancel();
    };

    const handleRestartClick = () => {
        restart();
    };

    return <div>
        <h3>New Site</h3>
        <input ref={nameRef} /> <br/>
        <button type='button' className='link' onClick={handleSaveClick}>save</button>
        <button type='button' className='link' onClick={handleRestartClick}>retry</button>
        <button type='button' className='link' onClick={handleCancelClick}>cancel</button>
    </div>;
};

export default NewSite;