import fs from 'fs';
import {centerOfMass, polygon} from '@turf/turf';

const data = fs.readFile('eccgi_sites_survey.geojson', 'utf-8', (error, json)=>{
    if (error) {
        return console.log('error', error);
    }
    const data = JSON.parse(json);
    data.features.forEach(f => {
        const turfPolygon = polygon(f.geometry.coordinates[0]);
        const center = centerOfMass(turfPolygon);
        console.log(f.properties.Name, "\n", center.geometry.coordinates);
    });
});
