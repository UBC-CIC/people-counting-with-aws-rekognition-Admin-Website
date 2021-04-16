import React, { useState, useEffect } from 'react';
import {Grid, Icon, Button, Label} from "semantic-ui-react";
import TextField from '@material-ui/core/TextField';
import {API, Auth, Storage} from 'aws-amplify';
import { v4 as uuid } from 'uuid';
import Navbar from "../components/Navbar/Navbar";
import awsconfig from '../aws-exports';
import Rector from '../components/RectCanvas';
import '../components/RectCanvas.css';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import EditableTable from "../components/EditableTable";
import "../App.css";

const MAX_ZONES = 2
const MAX_CAMERAS = 10

function Dashboard(props) {

    const [images, setImages] = useState([])
    const [x, setX] = useState(-1)
    const [y, setY] = useState(-1)
    const [curX, setCurX] = useState(-1)
    const [curY, setCurY] = useState(-1)
    const [i, setI] = useState(1)
    const [j, setJ] = useState(1)
    const [coords, setCoords] = useState([...Array(MAX_CAMERAS)].map(e => Array(MAX_ZONES)))
    const [deviceData, setDeviceData] = useState([...Array(MAX_CAMERAS)].map(e => Array(3)))
    const [sleepTimeFrame, setSleepTimeFrame] = useState({beginHour : 8, endHour : 22});
    const [price, setPrice] = useState(0)
    const [imageNames, setImageNames] = useState([])

    useEffect(() => {
        fetchImages()
    }, [])

    async function fetchImages() {
        // Fetch list of images from S3
        Storage.list('', { level: 'private' })
            .then(result => console.log(result))
            .catch(err => console.log(err));
        let s3images = await Storage.list('')
        console.log("fetchimages", s3images)
        let s3imageNames = await s3images.map(image => {
            const arr = image.key.split(".jpg")
            console.log(arr)
            return arr[0]
        })
        // Get presigned URL for S3 images to display images in app
        s3images = await Promise.all(s3images.map(async image => {
            const signedImage = await Storage.get(image.key)
            return signedImage
        }))
        console.log("here", s3images,s3imageNames, i, j)
        setImageNames(s3imageNames)
        setImages(s3images)

    }

    async function sendRequest(requestBody) {
        const apiName = awsconfig.aws_cloud_logic_custom[0].name;
        const path = '/items/{proxy+}';
        const myInit = {
            response: true,
            body: requestBody,
            headers: {}
        };
        console.log("sendRequest")
        return await API.put(apiName, path, myInit);
    }

    async function updateDeviceConfiguration(item) {
        let desiredDeviceState = {
            "samplingRate": item["samplingRate"],
            "photoWidth": 640,
            "photoHeight": 480,
            "beginHour": sleepTimeFrame.beginHour,
            "endHour": sleepTimeFrame.endHour
        }
        const response = await sendRequest({
            changeDeviceShadow : true,
            state : desiredDeviceState,
            thingName: item["deviceID"]
        })
        console.log(response)
    }

    async function listCurrentDevices() {
        const response = await sendRequest({
            listCurrentDevices : true,
        })
        console.log("listCurrentDevices", response)
        return response
    }

    async function updateDeviceShadows() {
        deviceData.map((item, index) => {
            if(item["stationName"] !== "" && item["deviceID"] !== "" && item["samplingRate"] !== ""){
                console.log(item)
                updateDeviceConfiguration(item)
            }
        })
        console.log("images", images);
        setPrice(20)
    }

    async function loadControlImages() {
        const response = await sendRequest({
            takePhoto : true
        })
        console.log(response)
    }

    const onRectSelected = (rect) => {
        setX(rect.x)
        setY(rect.y)
        setCurX(rect.xCur)
        setCurY(rect.yCur)
        setCoords(coords.map((item, index) => {
            if(index === (i-1))
                item[j-1] = [rect.x,rect.y,rect.xCur,rect.yCur]
            console.log("here", item)
            return item
        }))
        console.log(coords[0][0])
    };

    const onTableUpdate = (tableData) => {
        setDeviceData(tableData)
        console.log("updated Device Stata matrix")
    }

    async function updateDB() {
        let img = document.getElementById('image1');
        let width = img.clientWidth;
        let height = img.clientHeight;
        console.log(width, height)
        let zoneChoices = []
        if(imageNames.length !== 0)
            zoneChoices = [imageNames.length - 1].map(e => Array(MAX_ZONES))
        coords.map((item, index) => {
            item.map((it, ind) => {
                zoneChoices[index][ind] = {
                    X1: it[0],
                    X2: it[2],
                    Y1: it[1],
                    Y2: it[3],
                    id: uuid(),
                    name: `zone ${ind+1}`,
                    zoneNumber: ind+1
                }
            })
        })
        let cameraChoices = []
        if(imageNames.length !== 0)
            cameraChoices = new Array(imageNames.length - 1)
        await Promise.all(zoneChoices.map(async (item,index) => {
            let logicalName = ""
            deviceData.map((item,index) => {
                if(item["deviceID"] === imageNames[index]){
                    logicalName = item["stationName"]
                }
            })
            cameraChoices[index] = {
                id: imageNames[index],
                H: height,
                W: width,
                logicalName : logicalName,
                zones: item
            }
            console.log(cameraChoices[index])
            const quer = await API.graphql({
                query: queries.getCamera,
                variables: {id: imageNames[index]}
            })
            if(quer["data"]["getCamera"] == null){
                const response = await API.graphql({
                    query: mutations.createCamera,
                    variables: {input: cameraChoices[index]}
                })
                console.log(response)
            } else {
                const response = await API.graphql({
                    query: mutations.updateCamera,
                    variables: {input: cameraChoices[index]}
                })
                console.log(response)
            }
        }))
        console.log(cameraChoices)

    }

    const textFieldOnChange = (event) => {
        if(event.target.name === "endTime"){
            setSleepTimeFrame({
                beginHour : sleepTimeFrame.beginHour,
                endHour : event.target.value
            })
        }else if(event.target.name === "beginTime"){
            setSleepTimeFrame({
                beginHour : event.target.value,
                endHour : sleepTimeFrame.endHour
            })
        }
        console.log(sleepTimeFrame)
    };

    return (
                            <Grid style={{backgroundColor: "#ebebeb"}}>
                                <Grid.Row>
                                    <Grid.Column verticalAlign={"middle"} textAlign={"center"}>
                                        <Navbar />
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row style={{paddingBottom: "0px", paddingTop: "0px"}}>
                                    <Grid.Column>
                                        <Grid className={"box"}>
                                            <Grid.Row>
                                                <Grid.Column textAlign={"start"} verticalAlign={"middle"}>
                                                    <h2>Camera Settings</h2>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Column width={10} verticalAlign={"middle"} textAlign={"center"}>
                                                    <h3>Camera configuration table</h3>
                                                    <EditableTable getCurrentData={() => listCurrentDevices()} onTableUpdate={onTableUpdate}/>
                                                    <Button color={"grey"} onClick={() => {updateDeviceShadows()}}>Update device configurations</Button>
                                                </Grid.Column>
                                                <Grid.Column width={6} verticalAlign={"top"} textAlign={"center"}>
                                                    <Grid stackable>
                                                        <Grid.Row style={{paddingBottom: "0px"}}>
                                                            <Grid.Column>
                                                                <h3>Time frame</h3>
                                                            </Grid.Column>
                                                        </Grid.Row>
                                                        <Grid.Row columns={2}>
                                                            <Grid.Column>
                                                                <Label pointing={"right"}>Begin time</Label>
                                                                    <TextField
                                                                        id={"beginTime"}
                                                                        name={"beginTime"}
                                                                        type={"time"}
                                                                        defaultValue={"08:00"}
                                                                        onChange={textFieldOnChange}
                                                                        InputLabelProps={{
                                                                            shrink: true,
                                                                        }}
                                                                        inputProps={{
                                                                            step: 300, // 5 min
                                                                        }}
                                                                    />
                                                            </Grid.Column>
                                                            <Grid.Column>
                                                                <Label pointing={"right"}>End time</Label>
                                                                <TextField
                                                                    id={"endTime"}
                                                                    name={"endTime"}
                                                                    type={"time"}
                                                                    defaultValue={"22:00"}
                                                                    onChange={textFieldOnChange}
                                                                    InputLabelProps={{
                                                                        shrink: true,
                                                                    }}
                                                                    inputProps={{
                                                                        step: 300, // 5 min
                                                                    }}
                                                                />
                                                            </Grid.Column>
                                                        </Grid.Row>
                                                        <Grid.Row>

                                                        </Grid.Row>
                                                        <Grid.Row>
                                                            <Grid.Column width={5} />
                                                            <Grid.Column width={10} textAlign={"center"} verticalAlign={"middle"}>
                                                                <div className={"price-box"}>
                                                                    <Grid>
                                                                        <Grid.Row>
                                                                            <Grid.Column>
                                                                                <Grid>
                                                                                    <Grid.Row style={{paddingBottom: "0px", paddingTop: "25px"}}>
                                                                                        <Grid.Column>
                                                                                            <Icon name={"chart line"} style={{color: "green", fontSize: "40px", marginLeft: "8px"}} />
                                                                                        </Grid.Column>
                                                                                    </Grid.Row>
                                                                                    <Grid.Row style={{paddingTop: "0px"}}>
                                                                                        <Grid.Column>
                                                                                            <span style={{fontSize: "85%"}}>Estimated monthly cost based on provided configuration : <strong>${price}</strong></span>
                                                                                        </Grid.Column>
                                                                                    </Grid.Row>
                                                                                </Grid>
                                                                            </Grid.Column>
                                                                        </Grid.Row>
                                                                    </Grid>
                                                                </div>
                                                            </Grid.Column>
                                                            <Grid.Column width={1} />
                                                        </Grid.Row>
                                                    </Grid>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </Grid.Column>
                                </Grid.Row>

                                <Grid.Row style={{paddingTop: "0px", paddingBottom: "5px", marginTop: "-5px"}}>
                                    <Grid.Column>
                                        <Grid className={"box"}>
                                            <Grid.Row>
                                                <Grid.Column textAlign={"start"} verticalAlign={"middle"}>
                                                    <h2>Select zones</h2>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Column>
                                                    <Button size={"tiny"} onClick={() => {loadControlImages()}}>Load control images</Button>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Grid.Row style={{paddingTop: "0px"}}>
                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"}>
                                                    <div><p><h3>{imageNames[i-1]} Zone {j}</h3></p></div>
                                                    <Button color={"grey"} onClick={() => {updateDB()}}>Update DB</Button>
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Grid.Row style={{paddingTop: "0px"}}>
                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"}>
                                                    <div className={"image-box"} style={{display: "inline-block"}}>
                                                        <div id="rector" className="relative">
                                                            <div className="absoluteCanvas">
                                                                <img id="image1" src={images[i-1]} style={{
                                                                    width: "640",
                                                                    height: "480",
                                                                }}/>
                                                            </div>
                                                            <Rector width="640" height="480" onSelected={onRectSelected}/>
                                                        </div>
                                                        <div>
                                                            <div className='container' >
                                                                <button id="btn1" onClick={() => {
                                                                    if(i > 1)
                                                                        setI(i - 1)}
                                                                }>Prev Camera</button>
                                                                <button id="btn2" onClick={() => {
                                                                    if(j > 1)
                                                                        setJ(j - 1)}
                                                                }>Prev zone</button>
                                                                <button id="btn4" onClick={() => {
                                                                    if(j < MAX_ZONES)
                                                                        setJ(j + 1)}
                                                                }>Next zone</button>
                                                                <button id="btn3" onClick={() => {
                                                                    if(i < images.length - 1)
                                                                        setI(i + 1)
                                                                }
                                                                }>Next camera</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
    );
}


export default Dashboard;