import React, {useState, useEffect, useRef} from 'react';

import { mapboxToken } from '../../keys/mapbox';
import mapboxgl from 'mapbox-gl';
mapboxgl.accessToken = mapboxToken;

import './mapbox.css';

const GeoLocator = ({onDone, initialValue=null}) => {
  const [coordinates, setCoordinates] = useState(initialValue);
  const [error, setError] = useState('');
  const [isGetInProgress, setGetInProgress] = useState(false);
  const handleGet = () => {
    setGetInProgress(true);
    navigator.geolocation.getCurrentPosition(res => {
      setCoordinates({lng: res.coords.longitude, lat: res.coords.latitude, accuracy: res.coords.accuracy});
      setGetInProgress(false);
    }, err => {
      let error = ({1: 'permission deined', 2: 'position unavailable', 3: 'timeout'})[err.code]  + ' ' + err.message;
      console.log(error);
      setError(error);
    }, {
      maximumAge: 0,
      timeout: 1000 * 60,
      enableHighAccuracy: true
    });
  };

  const [isEdit, setEdit] = useState(false);

  const mapContainer = useRef(null);
  const map = useRef(null);
  useEffect(() => {
    if (coordinates && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [coordinates.lng, coordinates.lat],
        zoom: 16
      });
      map.current.on('load', () => {
        map.current.addSource('currentLocation', {
          type: 'geojson',
          data: {
            type: 'Point',
            coordinates: [coordinates.lng, coordinates.lat]
          }
        });
        map.current.addLayer({
          id: 'currentLocation',
          type: 'circle',
          source: 'currentLocation',
          style: {
            type: 'circle',
            layout: {
              'circle-radius': 4,
              'circle-color': 'blue',
              'circle-stroke-color': 'black',
              'circl-stroke-width': 1
            }
          }
        });
      });
    }
  }, [coordinates]);

  // let's make sure the timeout used in "handleEdit" can be cancelled, if component is deconstructed
  //   as timeout is waiting, to avoid errors
  const setEditOffWithDelayTimeoutId = useRef(null);
  useEffect(() => {
    // make sure to
    return () => {
      if (setEditOffWithDelayTimeoutId.current) {
        clearTimeout(setEditOffWithDelayTimeoutId.current);
        setEditOffWithDelayTimeoutId.current = null;
      }
    }
  }, []);

  const handleEdit = () => {
    // going from ON to OFF
    if (isEdit) {
      const newCoordinates  = map.current.getCenter();
      map.current.getSource('currentLocation').setData({
        type: 'Point',
        coordinates: [newCoordinates.lng, newCoordinates.lat]
      });
      setCoordinates({...coordinates, ...newCoordinates});
      setEditOffWithDelayTimeoutId.current = setTimeout(() => {
        setEdit(false);
      },1500);
    } else {
      if (setEditOffWithDelayTimeoutId.current) {
        clearTimeout(setEditOffWithDelayTimeoutId.current);
      }
      map.current.setCenter([coordinates.lng, coordinates.lat]);
      setEdit(true);
    }
  };

  const handleConfirm = () => {
    onDone({lng: coordinates.lng, lat: coordinates.lat});
  };

  return <div>
    {!coordinates ?
      <div>
        <button onClick={handleGet} disabled={isGetInProgress}>{isGetInProgress ? 'Getting location...' : 'Get Current Location'}</button>
      </div> :
      <div>
        <div style={{width: '300px', height: '300px', position: 'relative'}}>
          <svg style={{width: '40px', position: 'absolute', bottom: 'calc(50% - 5px)', left: '50%', fill: '#ff28c4', display: isEdit ? '':'none'}} viewBox="0 0 100 100">
            <path d="M50,89.5c0.32,0,0.62-0.17,0.78-0.43c1.03-1.59,24.88-39.15,24.88-52.91C75.66,22.02,64.15,10.5,50,10.5  c-14.15,0-25.66,11.51-25.66,25.66c0,13.75,23.85,51.32,24.88,52.91C49.38,89.33,49.68,89.5,50,89.5z M33.46,36.16  c0-9.13,7.41-16.55,16.54-16.55c9.13,0,16.54,7.43,16.54,16.55c0,9.11-7.41,16.54-16.54,16.54C40.87,52.7,33.46,45.27,33.46,36.16z">
            </path>
          </svg>
          <div ref={mapContainer} className="map-container" style={{width: '100%', height: '100%'}}>
          </div>
        </div>
        <div>Location: longitude={coordinates.lng}, latitude={coordinates.lat} (accuracy: {coordinates.accuracy})</div>
        <button onClick={handleEdit}>{isEdit ? 'Done Editing' : 'Adjust Location'}</button>
        <button onClick={handleConfirm}>Confirm Location is Correct</button>
      </div>
    }
    {error ? <div>{error}</div> : null}
  </div>
}

export default GeoLocator;
