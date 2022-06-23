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

const Map = ({sites, onSiteSelected, onMapMove, isAddNewSiteReset, isAddNewSite=false}) => {
    const map = useRef(null);
    const container = useRef(null);

    const [hasSiteMapLayers, setHasSiteMapLayers] = useState(false);
    const layerId = 'sites_from_db';
    const addSitesMapLayer = () => {
        map.current.addSource('new_site_point', {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: []
            }
        });
        map.current.addLayer({
            id: 'new_site_point',
            type: 'symbol',
            source: 'new_site_point',
            layout: {
                "icon-image": "noun-map-pin-1058556",
                "icon-offset": [0, -55],
                "icon-size": 0.5,
                "icon-rotate": -45,
                "icon-allow-overlap": true
            }
        });

        map.current.addSource(layerId, {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: []
            },
            promoteId: 'id'
        });
        map.current.addSource(layerId+'__centers', {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: []
            },
            promoteId: 'id'
        });
        map.current.addSource(layerId+'__custom', {
            type: 'geojson',
            data: {
                type: "FeatureCollection",
                features: []
            },
            promoteId: 'id'
        });

        map.current.addLayer({
            id: layerId,
            type: 'fill',
            source: layerId,
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

        map.current.addLayer({
            id: layerId+'__custom',
            type: 'circle',
            source: layerId+'__custom',
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
        map.current.addLayer({
            id: layerId+'__text',
            type: 'symbol',
            source: layerId+'__centers',
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
        const sitesData = {
            type: "FeatureCollection",
            features: []
        };
        const sitesDataCustom = {
            type: "FeatureCollection",
            features: []
        };
        const sitesDataCenters = {
            type: "FeatureCollection",
            features: []
        };

        Object.values(sites).forEach(site => {
            //console.log(site.id, site.name, turfCenter(turfPolygon(JSON.parse(site.coordinates)[0])));
            if (!!site.is_user_defined) {
                sitesDataCustom.features.push({
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
                sitesData.features.push({
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

            sitesDataCenters.features.push({
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
        });

        map.current.getSource(layerId).setData(sitesData);
        map.current.getSource(layerId+'__custom').setData(sitesDataCustom);
        map.current.getSource(layerId+'__centers').setData(sitesDataCenters);
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
                coordinates: Object.values(map.current.unproject(newSitePoint))
            }
        }];

        map.current.getSource('new_site_point').setData({
            type: "FeatureCollection",
            features: data
        });
    }, [newSitePoint, hasSiteMapLayers]);

    useEffect(() => {
        if (!mapClickEvent) {
            return;
        }
        const bufferAroundClick = 2;
        const pointWithBuffer = makeRectangleBuffer(map.current, mapClickEvent.point, bufferAroundClick, false, true);

        // TEST the click hotspot by adding the precise rectangular buffer to see where the actual click is
        // const rectBuffer = makeRectangleBuffer(map.current, mapClickEvent.point, bufferAroundClick, true, false);

        const features = map.current.queryRenderedFeatures(pointWithBuffer, {layers: [layerId, layerId+'__custom']});

        map.current.removeFeatureState({source: layerId});
        map.current.removeFeatureState({source: layerId+'__custom'});
        map.current.removeFeatureState({source: layerId+'__centers'});

        if (features.length) {
            const newCurrentSiteId = features[0].id;
            map.current.setFeatureState({id: newCurrentSiteId, source: features[0].source}, {focus: true});
            map.current.setFeatureState({id: newCurrentSiteId, source: layerId+'__centers'}, {focus: true});
            onSiteSelected(newCurrentSiteId, mapClickEvent.point);
            setNewSitePoint(false);
        } else {
            if (isAddNewSite) {
                onSiteSelected('new', mapClickEvent.point, map.current.unproject(mapClickEvent.point));
                setNewSitePoint(mapClickEvent.point);
            } else {
                onSiteSelected(false);
                setNewSitePoint(false);
            }
        }
    }, [mapClickEvent]);

    const [dragStart, setDragStart] = useState(null);
    const [dragEnd, setDragEnd] = useState(null);
    const handleMapDragStart = (e) => {
        setDragStart({x: e.originalEvent.x, y: e.originalEvent.y});
    };
    const handleMapDragEnd = (e) => {
        setDragEnd({x: e.originalEvent.x, y: e.originalEvent.y});
    };
    useEffect(() => {
        if (!dragStart) {
            return;
        }
        const dragDelta = {x: dragStart.x - dragEnd.x, y: dragStart.y - dragEnd.y};
        onMapMove(dragDelta);
    }, [dragEnd]);

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
                style: 'mapbox://styles/hyphae-lab/cl4ekvfdg000015npvrzwo7fu'
            });
            map.current.on('load', handleMapLoad);
            map.current.on('click', handleMapClickWrapper);
            map.current.on('dragstart', handleMapDragStart);
            map.current.on('dragend', handleMapDragEnd);
        }

        return () => {
            if (map.current) {
                mapLoadedPromise.reject(false);
                map.current.off('load', handleMapLoad);
                map.current.off('click', handleMapClickWrapper);
                map.current.off('dragstart', handleMapDragStart);
                map.current.off('dragend', handleMapDragEnd);
            }
        };
    }, []);

    return (<div style={{width: '100%', height: '100%'}}>
        <div ref={container} className={'map-container '+(isAddNewSite ? 'is-add-new-feature-mode':'')} style={{width: '100%', height: '100%'}}></div>
    </div>);
};

export default Map;