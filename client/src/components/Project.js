import React, {useEffect, useState, useRef} from 'react';
import InputString from "./InputString";
import Maps from "./Maps";
import InputNumber from "./InputNumber";
import InputBoolean from "./InputBoolean";
import EditSensor from './EditSensor';
import {addDoc, updateDoc, deleteDoc, doc, collection, query, where, getDocs} from "firebase/firestore";
// Create a storage reference from our storage service
import { ref, uploadString, getDownloadURL } from "firebase/storage";

const Project = ({firebaseApp, project, saveProject, deleteProject, setCurrentProject, setStep}) => {
    const [sensorToEdit, setSensorToEdit] = useState(false);

    const [sensors, setSensors] = useState([]);
    const [isSensorsLoading, setSensorsLoading] = useState(false);
    useEffect(() => {
        if (!project.id) {
            return; // no need for fetching sensors of new project
        }
        const sensorsRef = collection(firebaseApp.db, "sensors");
        // Create a query against the collection.
        const q = query(sensorsRef, where("network", "==", project.id));
        setSensorsLoading(true);
        getDocs(q).then(qSnapshot => {
            const sensors_ = [];
            qSnapshot.forEach(doc => {
                sensors_.push(doc.data());
            });
            setSensors(sensors_);
            setSensorsLoading(false);
        });
    }, [project]);

    const addNewSensor = () => {
        setSensorToEdit({});
    }

    const closeProject = () => {
      setCurrentProject(null);
      setSensorToEdit(false);
      setStep('projects');
    }

    const saveSensor = (sensor) => {
        sensor.network = project.id;
        if (!sensor.id) {
            return addDoc(collection(firebaseApp.db, "sensors"), sensor).then(docRef => {
                console.log("Sensor written with ID: ", docRef.id);
                sensor.id = docRef.id;
                setSensors([...sensors, sensor]);
                setSensorToEdit(sensor);
            }).catch(e => {
                console.error("Error adding sensor: ", e);
            });
        } else {
            const sensorDoc = doc(firebaseApp.db, "sensors", sensor.id);
            return updateDoc(sensorDoc, sensor).then(response => {
                const sensorsCopy = sensors.map(s => s.id === sensor.id ? {...sensor}:s);
                setSensors(sensorsCopy);
                setSensorToEdit(sensor);
            }).catch(e => {
                console.error("Error editing sensor: ", e.message);
            });
        }
    }

    const cancelSaveSensor = () => {
        setSensorToEdit(false);
    };

    return <div>
        <div><a href='#' onClick={closeProject}>&lt;&lt; Back to all Projects</a></div>
        {!sensorToEdit ?
            <div>
                <InputString onSave={saveProject} value={project.id ? project.name : 'New Project'} path='name' type='string' isOnlyEditMode={!project.id} hasLabel={false} wrapEl='h2'/>
                <InputString onSave={saveProject} value={project.description} path='description' type='string' />

                {!!project.id && <div>
                    <h3>Sensors:</h3>
                    {isSensorsLoading && <div className='spinning-loader'></div>}
                    {sensors && !sensors.length && <div>(no sensors)</div>}
                    {sensors && sensors.map(sensor =>
                        <div>{sensor.label}<a href='#edit' onClick={setSensorToEdit.bind(null, sensor)}>edit</a></div>
                    )}
                    <div>
                        <a href='#add-sensor' onClick={addNewSensor}>Add New Sensor</a>
                    </div>
                </div>}

                <div>
                    <a href='#delete' style={{color: 'red'}} onClick={deleteProject.bind(null, project.id)}>(x) delete project</a>
                </div>
            </div>
            :
            <div>
                <h2>{project.name}: Sensors</h2>
                <EditSensor sensor={sensorToEdit} onSave={saveSensor} onCancel={cancelSaveSensor} />
            </div>}
    </div>;
};

export default Project;

