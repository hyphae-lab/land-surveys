const fs = require('fs');

const data = fs.readFile('eccgi_sites_survey.geojson', 'utf-8', (error, json)=>{
    if (error) {
        return console.log('error', error);
    }
    const data = JSON.parse(json);
    data.features.forEach(f => {
        console.log(f.properties.name, "\n", JSON.stringify(f.geometry.coordinates));
    });
});
