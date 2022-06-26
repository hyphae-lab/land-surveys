import React, {useState, useEffect, useRef} from 'react';
import mapboxgl from "mapbox-gl";
import '../../node_modules/mapbox-gl/src/css/mapbox-gl.css';
import './mapbox.css';
import {makeRectangleBuffer} from '../mapboxHelpers';
import { mapboxToken } from '../../keys/mapbox';
mapboxgl.accessToken = mapboxToken;

import {makePromiseFactory as makePromise} from "../helpers";
//"@turf/turf": "^6.5.0"
//import { polygon as turfPolygon, centerOfMass as turfCenter } from '@turf/turf';

const mapLoadedPromise = makePromise();

// create names of layers and layer data source with a suffix so it never can
//   be in conflict with the mapbox style layers
const layerSuffix = (Math.pow(16, 5) + (Math.pow(16, 5) - 1)).toString(16);
const sitesPolygonLayerId = ['sites', 'polygon', layerSuffix].join('_');
const sitesPointLayerId = ['sites', 'point', layerSuffix].join('_');
const proposedSitesPointLayerId = ['proposed_sites', 'point', layerSuffix].join('_');
const sitesLabelLayerId = ['sites', 'label', layerSuffix].join('_');
const newProposedSitesPointLayerId = ['new_proposed_sites', 'point', layerSuffix].join('_');

const Map = ({sites, onSiteSelected, isAddNewSiteReset, isAddNewSite=false}) => {
    const map = useRef(null);
    const container = useRef(null);

    const [hasSiteMapLayers, setHasSiteMapLayers] = useState(false);

    const addSitesMapLayer = () => {
        map.current.addSource(newProposedSitesPointLayerId, {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: []
            }
        });
        map.current.addLayer({
            id: newProposedSitesPointLayerId,
            type: 'symbol',
            source: newProposedSitesPointLayerId,
            layout: {
                "icon-image": "noun-map-pin-1058556",
                "icon-offset": [0, -55],
                "icon-size": 0.5,
                "icon-rotate": -45,
                "icon-allow-overlap": true
            }
        });

        map.current.addSource(sitesPolygonLayerId, {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: []
            },
            promoteId: 'id'
        });
        map.current.addLayer({
            id: sitesPolygonLayerId,
            type: 'fill',
            source: sitesPolygonLayerId,
            paint: {
                'fill-outline-color': [
                    'case',
                    ['boolean', ['feature-state', 'focus'], false],
                    'black',
                    'blue'
                ],
                'fill-color':  [
                    'case',
                    ['boolean', ['feature-state', 'focus'], false],
                    'red',
                    '#4f4af2'
                ],
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'focus'], false],
                    0.8,
                    0.7
                ]
            }
        });
        map.current.addSource(sitesPointLayerId, {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: []
            },
            promoteId: 'id'
        });
        map.current.addLayer({
            id: sitesPointLayerId,
            type: 'circle',
            source: sitesPointLayerId,
            paint: {
                "circle-color": ['case', ['boolean', ['feature-state', 'focus'], false], "red", "#4ad1f2"],
                "circle-radius": 8
            }
        });

        map.current.addSource(proposedSitesPointLayerId, {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: []
            },
            promoteId: 'id'
        });
        map.current.addLayer({
            id: proposedSitesPointLayerId,
            type: 'circle',
            source: proposedSitesPointLayerId,
            paint: {
                'circle-stroke-color': [
                    'case',
                    ['boolean', ['feature-state', 'focus'], false],
                    'black',
                    'blue'
                ],
                'circle-color':  [
                    'case',
                    ['boolean', ['feature-state', 'focus'], false],
                    'red',
                    '#4f4af2'
                ],
                'circle-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'focus'], false],
                    0.8,
                    0.7
                ],
                'circle-radius': 10
            }
        });

        // need a separate layer for text, as some polygons are "multi-polygons"
        //   so Mapbox adds a label for each sub-polygon of the multi-polygon (duplicating)

        map.current.addSource(sitesLabelLayerId, {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: []
            },
            promoteId: 'id'
        });
        map.current.addLayer({
            id: sitesLabelLayerId,
            type: 'symbol',
            source: sitesLabelLayerId,
            layout: {
                'text-field': ["to-string", ["get", "name"]],
                'text-anchor': 'bottom-right',
                'text-radial-offset': 1
            },
            paint: {
                'text-halo-color': 'black',
                'text-halo-blur':  ['case',
                    ['boolean', ['feature-state', 'focus'], false],
                    1,
                    0
                ],
                'text-halo-width': ['case',
                    ['boolean', ['feature-state', 'focus'], false],
                    2,
                    0
                ],
                'text-color': [
                    'case',
                    ['boolean', ['feature-state', 'focus'], false],
                    'white',
                    'black'
                ]
            }
        });
        setHasSiteMapLayers(true);
    };

    useEffect(() => {
        if (sites && Object.keys(sites).length) {
            mapLoadedPromise.promise.then(addSitesLayerData);
        }
    }, [sites]);

    const addSitesLayerData = () => {
        const sitesPolygonData = {
            type: "FeatureCollection",
            features: []
        };
        const sitesPointData = {
            type: "FeatureCollection",
            features: []
        };
        const proposedSitesPointData = {
            type: "FeatureCollection",
            features: []
        };
        const sitesLabelData = {
            type: "FeatureCollection",
            features: []
        };

        Object.values(sites).forEach(site => {
            //console.log(site.id, site.name, turfCenter(turfPolygon(JSON.parse(site.coordinates)[0])));
            if (site.type === 'bus_stop') {
                sitesPointData.features.push({
                    type: "Feature",
                    properties: {
                        id: site.id,
                        name: site.name+' (bus stop)',
                    },
                    geometry: {
                        type: "Point",
                        coordinates: JSON.parse(site.center)
                    }
                });
            } else if (!!site.is_user_defined) {
                proposedSitesPointData.features.push({
                    type: "Feature",
                    properties: {
                        id: site.id,
                        name: site.name,
                    },
                    geometry: {
                        type: "Point",
                        coordinates: JSON.parse(site.center)
                    }
                });
            } else {
                sitesPolygonData.features.push({
                    type: "Feature",
                    properties: {
                        id: site.id,
                        name: site.name,
                    },
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: JSON.parse(site.coordinates)
                    }
                });
            }

            sitesLabelData.features.push({
                type: "Feature",
                properties: {
                    id: site.id,
                    name: site.name + (site.type==='bus_stop' ? ' (bus stop)':''),
                },
                geometry: {
                    type: "Point",
                    coordinates: JSON.parse(site.center)
                }
            });
        });

        map.current.getSource(sitesPolygonLayerId).setData(sitesPolygonData);
        map.current.getSource(sitesPointLayerId).setData(sitesPointData);
        map.current.getSource(proposedSitesPointLayerId).setData(proposedSitesPointData);
        map.current.getSource(sitesLabelLayerId).setData(sitesLabelData);
    }

    const [mapClickEvent, setMapClickEvent] = useState(null);
    const handleMapClickWrapper = e => {
        setMapClickEvent(e);
    };

    const [newSitePoint, setNewSitePoint] = useState(null);
    useEffect(() => {
        if (!hasSiteMapLayers) {
            return;
        }

        const data = !newSitePoint ? [] : [{
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: newSitePoint.toArray()
            }
        }];

        map.current.getSource(newProposedSitesPointLayerId).setData({
            type: "FeatureCollection",
            features: data
        });
    }, [newSitePoint, hasSiteMapLayers]);

    // lng-lat point of last click that either was at
    //   an existing geometry on map or
    //   a new geom to add
    const [clickPoint, setClickPoint] = useState(null);
    useEffect(() => {
        if (!clickPoint) {
            return;
        }
        map.current.flyTo({center: clickPoint.toArray(), screenSpeed: .4});
    }, [clickPoint]);

    useEffect(() => {
        if (!mapClickEvent) {
            return;
        }
        const bufferAroundClick = 2;
        const pointWithBuffer = makeRectangleBuffer(map.current, mapClickEvent.point, bufferAroundClick, false, true);

        // TEST the click hotspot by adding the precise rectangular buffer to see where the actual click is
        // const rectBuffer = makeRectangleBuffer(map.current, mapClickEvent.point, bufferAroundClick, true, false);

        const features = map.current.queryRenderedFeatures(pointWithBuffer, {layers: [sitesPolygonLayerId, sitesPointLayerId, proposedSitesPointLayerId]});

        map.current.removeFeatureState({source: sitesPolygonLayerId});
        map.current.removeFeatureState({source: sitesPointLayerId});
        map.current.removeFeatureState({source: proposedSitesPointLayerId});
        map.current.removeFeatureState({source: sitesLabelLayerId});

        if (features.length) {
            const newCurrentSiteId = features[0].id;
            map.current.setFeatureState({id: newCurrentSiteId, source: features[0].source}, {focus: true});
            map.current.setFeatureState({id: newCurrentSiteId, source: sitesLabelLayerId}, {focus: true});
            onSiteSelected(newCurrentSiteId);
            setNewSitePoint(false);
            setClickPoint(map.current.unproject(mapClickEvent.point));
        } else {
            if (isAddNewSite) {
                const clickLngLat = map.current.unproject(mapClickEvent.point);
                onSiteSelected('new', clickLngLat);
                setNewSitePoint(clickLngLat);
                setClickPoint(clickLngLat);
            } else {
                onSiteSelected(false);
                setNewSitePoint(false);
            }
        }
    }, [mapClickEvent]);

    // if add-new mode is ON again (force-refreshed from ON to ON),
    //   reset the new site location
    // then only run usual site cancel if current add new mode is ON
    useEffect(() => {
        if (isAddNewSiteReset > 0) {
            setNewSitePoint(false);
            onSiteSelected(false);
        }
    }, [isAddNewSiteReset]);

    useEffect(() => {
        if (!isAddNewSite) {
            setNewSitePoint(false);
            onSiteSelected(false);
        }
    }, [isAddNewSite]);

    const handleMapLoad = () => {
        addSitesMapLayer();
        mapLoadedPromise.resolve(true);
    };

    useEffect(() => {
        if (!map.current) {
            map.current = new mapboxgl.Map({
                container: container.current,
                cooperativeGestures: true,
                style: 'mapbox://styles/hyphae-lab/cl4ekvfdg000015npvrzwo7fu'
            });
            map.current.on('load', handleMapLoad);
            map.current.on('click', handleMapClickWrapper);
        }

        return () => {
            if (map.current) {
                mapLoadedPromise.reject(false);
                map.current.off('load', handleMapLoad);
                map.current.off('click', handleMapClickWrapper);
            }
        };
    }, []);

    return (<div style={{width: '100%', height: '100%'}}>
        <div ref={container} className={'map-container '+(isAddNewSite ? 'is-add-new-feature-mode':'')} style={{width: '100%', height: '100%'}}></div>
    </div>);
};

export default Map;