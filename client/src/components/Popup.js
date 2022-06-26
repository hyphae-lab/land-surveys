import React, {useRef, useState, useEffect} from 'react';

const Popup = ({children}) => {
    const [leftMargin, setLeftMargin] = useState(0);
    const elRef = useRef(null);
    useEffect(() => {
        if (elRef.current) {
            const style = window.getComputedStyle(elRef.current);
            const windowWidth = window.innerWidth;
            const width = parseInt(style.width);
            setLeftMargin(width > windowWidth ? 0 : (windowWidth - width)/2);
        }
    }, []);

    return <div ref={elRef} style={{
        position: 'absolute',
        top: 'calc(50% + 30px)',
        overflowY: 'scroll',
        maxHeight: 'calc(50% - 30px)',
        maxWidth: '450px',
        marginLeft: `${leftMargin}px`,
        backgroundColor: 'white', border: '1px solid grey'
    }}>
        {children}
    </div>;
};

export default Popup;