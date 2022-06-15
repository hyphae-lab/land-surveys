import React, {useState, useEffect, useRef} from 'react';
import mapboxgl from "mapbox-gl";

import { mapboxToken } from '../../keys/mapbox';
mapboxgl.accessToken = mapboxToken;

import {makePromiseFactory as makePromise} from "../helpers";
//"@turf/turf": "^6.5.0"
//import { polygon as turfPolygon, centerOfMass as turfCenter } from '@turf/turf';

const mapLoadedPromise = makePromise();

const Map = ({sites, onSiteSelected, onMapMove}) => {
    const map = useRef(null);
    const container = useRef(null);

    const layerId = 'sites_from_db';
    const addSitesMapLayer = () => {
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
                    'magenta'
                ],
                'fill-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'focus'], false],
                    0.7,
                    0.3
                ]
            }
        });
        map.current.addLayer({
            id: layerId+'__text',
            type: 'symbol',
            source: layerId+'__centers',
            layout: {
                'text-field': ["concat", ["to-string", ["get", "name"]], ' (', ["to-string", ["get", "comment_count"]], ')'],
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
    };

    const addSitesLayerData = () => {
        const sitesGeoData = {
            type: "FeatureCollection",
            features: []
        };
        const sitesGeoDataCenters = {
            type: "FeatureCollection",
            features: []
        };

        Object.values(sites).forEach(site => {
            //console.log(site.id, site.name, turfCenter(turfPolygon(JSON.parse(site.coordinates)[0])));
            sitesGeoData.features.push({
                type: "Feature",
                properties: {
                    id: site.id,
                    name: site.name,
                    comment_count: site.comment_count ? parseInt(site.comment_count) : 0
                },
                geometry: {
                    type: "MultiPolygon",
                    coordinates: JSON.parse(site.coordinates)
                }
            });
            sitesGeoDataCenters.features.push({
                type: "Feature",
                properties: {
                    id: site.id,
                    name: site.name,
                    comment_count: site.comment_count ? parseInt(site.comment_count) : 0
                },
                geometry: {
                    type: "Point",
                    coordinates: JSON.parse(site.center)
                }
            });
        });

        map.current.getSource(layerId).setData(sitesGeoData);
        map.current.getSource(layerId+'__centers').setData(sitesGeoDataCenters);
    }

    useEffect(() => {
        if (sites && Object.keys(sites).length) {
            mapLoadedPromise.promise.then(addSitesLayerData);
        }
    }, [sites]);

    const handleMapClick = e => {
        const bufferAroundClick = 2;
        const pointWithBuffer = [
            [e.point.x - bufferAroundClick, e.point.y - bufferAroundClick],
            [e.point.x + bufferAroundClick, e.point.y + bufferAroundClick]
        ];
        const features = map.current.queryRenderedFeatures(pointWithBuffer, {layers: [layerId]});

        map.current.removeFeatureState({source: layerId});
        map.current.removeFeatureState({source: layerId+'__centers'});

        if (features.length) {
            const newCurrentSiteId = features[0].id;
            map.current.setFeatureState({id: newCurrentSiteId, source: layerId}, {focus: true});
            map.current.setFeatureState({id: newCurrentSiteId, source: layerId+'__centers'}, {focus: true});
            onSiteSelected(newCurrentSiteId, e.point);
        } else {
            onSiteSelected(false);
        }
    };

    const handleMapLoad = () => {
        addSitesMapLayer();
        mapLoadedPromise.resolve(true);
    };

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

    useEffect(() => {
        if (!map.current) {
            map.current = new mapboxgl.Map({
                container: container.current,
                style: 'mapbox://styles/hyphae-lab/cl4ekvfdg000015npvrzwo7fu'
            });
            map.current.on('load', handleMapLoad);
            map.current.on('click', handleMapClick);
            map.current.on('dragstart', handleMapDragStart);
            map.current.on('dragend', handleMapDragEnd);
        }

        return () => {
            if (map.current) {
                mapLoadedPromise.reject(false);
                map.current.off('load', handleMapLoad);
                map.current.off('click', handleMapClick);
                map.current.off('dragstart', handleMapDragStart);
                map.current.off('dragend', handleMapDragEnd);
            }
        };
    }, []);

    return (<div ref={container} className="map-container" style={{width: '100%', height: '100%'}}></div>);
};

export default Map;