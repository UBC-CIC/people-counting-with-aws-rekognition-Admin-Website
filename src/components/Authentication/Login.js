import {Grid, Button, Input, Image, Icon} from "semantic-ui-react";
import {Auth} from "aws-amplify";
import React, {useState, useEffect} from "react";
import { connect } from "react-redux";
import {updateLoginState} from "../../actions/loginActions";
import "./Login.css";


const initialFormState = {
    email: "", password: "", authCode: "", resetCode: ""
}

function Login(props) {
    const {loginState, updateLoginState, animateTitle, type, title, darkMode, logo, themeColor} = props;
    const [formState, updateFormState] = useState(initialFormState);
    const [accountLoginError, setAccountLoginError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] =  useState(null);



    useEffect(() => {
        async function retrieveUser() {
            try {
                Auth.currentAuthenticatedUser().then(user => {
                    updateLoginState("signedIn");
                }).catch(err => {
                    updateLoginState("signIn");
                })

            } catch (e) {

            }
        }
        retrieveUser();
    }, []);

    function onChange(e) {
        e.persist();
        setAccountLoginError(false);
        updateFormState(() => ({...formState, [e.target.name]: e.target.value}))
    }

    async function signIn(){
        try {
            setLoading(true);
            const {email, password} = formState;
            let user = await Auth.signIn(email, password);
            if (user.challengeName === "NEW_PASSWORD_REQUIRED") {
                updateLoginState("newUserPassword");
                setLoading(false);
                setCurrentUser(user);
            } else {
                updateLoginState("signedIn");
                setLoading(false);
            }
        } catch (e) {
            setAccountLoginError(true);
            setLoading(false);
        }
    }

    async function setNewPassword() {
        try {
            const {email, password} = formState;
            setLoading(true);
            await Auth.completeNewPassword(currentUser, password, {email: email});
            updateLoginState("signedIn");
            setLoading(false);
        } catch (e) {
            setLoading(false);
        }
    }

    async function forgotPassword() {
        try {
            const {email} = formState;
            setLoading(true);
            await Auth.forgotPassword(email);
            setLoading(false);
            updateLoginState("resetPassword");
        } catch (e) {
            setLoading(false);
            updateLoginState("resetPassword");
        }
    }

    async function resetPassword() {
        try {
            const {email, resetCode, password} = formState;
            setLoading(true);
            await Auth.forgotPasswordSubmit(email, resetCode, password);
            setLoading(false);
            updateLoginState("signIn");
        } catch (e) {
            setLoading(false);
        }
    }

    let logoType = (darkMode)? "/Assets/Images/logo_inverse.png" : "/Assets/Images/logo.png";

    return (
        <Grid style={{width: "100vw", height: "100vh"}} stackable>
            <Grid.Row style={{width: "100vw", height: "100vh"}}>
                {/*  An example image is provided. Please use a royalty-free photo, a photo owned by you, or a photo owned by the CIC */}
                <Grid.Column width={9} style={
                    (type === "image")? (themeColor === "standard")? { backgroundColor: "#012144", backgroundImage: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(./Assets/Images/background.jpg)", backgroundSize: "cover", backgroundRepeat: "no", width: "100%", height: "100vh"} :
                        { backgroundColor: themeColor, backgroundImage: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(./Assets/Images/background.jpg)", backgroundSize: "cover", backgroundRepeat: "no", width: "100%", height: "100vh"} :
                    (themeColor === "standard")? { backgroundColor: "#012144", width: "100%", height: "100vh"} : { backgroundColor: themeColor, width: "100%", height: "100vh"}
                }>
                    {/* Please use a royalty free video or a video that you or the CIC owns */}
                    {(type === "video")?
                        <video playsInline autoPlay muted loop>
                            <source src={process.env.PUBLIC_URL + "/Assets/Videos/video.mp4"} type="video/mp4" />
                        </video>
                        : null}
                    <Grid style={{width: "100%", height: "100%"}}>
                        <Grid.Row>
                            <Grid.Column textAlign={"center"} verticalAlign={"bottom"} className={"typewriter"} only={"mobile"} mobile={16}>
                                <h3 className={(animateTitle)? (darkMode)? "line anim-typewriter" : "line anim-typewriter-light lightMode" : (darkMode)? "line-static" : "line-static lightMode-static"}>{title}</h3>
                            </Grid.Column>
                            <Grid.Column textAlign={"center"} verticalAlign={"bottom"} className={"typewriter"} only={"tablet"} tablet={16}>
                                    <h1 style={{fontSize: "250%"}} className={(animateTitle)? (darkMode)? "line anim-typewriter" : "line anim-typewriter-light lightMode" : (darkMode)? "line-static" : "line-static lightMode-static"}>{title}</h1>
                            </Grid.Column>
                            <Grid.Column textAlign={"center"} verticalAlign={"bottom"} className={"typewriter"} only={"computer"} computer={16}>
                                <h1 style={{fontSize: "300%"}} className={(animateTitle)? (darkMode)? "line anim-typewriter" : "line anim-typewriter-light lightMode" : (darkMode)? "line-static" : "line-static lightMode-static"}>{title}</h1>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column width={1}/>
                            <Grid.Column width={14} textAlign={"center"} verticalAlign={"bottom"}>
                                {(logo !== "none")? <Image src={process.env.PUBLIC_URL + logoType} fluid/> : null}
                            </Grid.Column>
                            <Grid.Column width={1}/>
                        </Grid.Row>
                    </Grid>
                </Grid.Column>
                <Grid.Column tablet={1} only={"tablet"} />
                <Grid.Column computer={1}  only={"computer"} />
                <Grid.Column mobile={6} tablet={5} computer={5} textAlign={"right"} verticalAlign={"middle"}>
                    <Grid style={{marginLeft: "3.00%", paddingTop: "10px", paddingBottom: "10px"}}>
                        <Grid.Row>
                            <Grid.Column textAlign={"center"} verticalAlign={"middle"}>
                                <div className={"login-box"}>
                                    <Grid>
                                        <Grid.Row style={{padding: "0px"}}>
                                            <Grid.Column verticalAlign={"middle"} textAlign={"left"}>
                                                <div className={"login-wrapper-top"} style={(themeColor === "standard")? {backgroundColor: "#012144"} : {backgroundColor: themeColor}}>
                                                    <span className={"login-wrapper-top-header"}>{(loginState === "signIn")? <span>Sign In</span> : (loginState === "signUp")? <span>Sign Up</span> : (loginState === "confirmSignUp")? <span>Verify Account</span> : (loginState === "forgotPassword" || loginState === "resetPassword")? <span>Password Reset</span> : (loginState === "newUserPassword")? <span>Set Password</span> : <span>Welcome</span>}</span>
                                                </div>
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row>
                                            <Grid.Column verticalAlign={"middle"} textAlign={"center"}>
                                                {
                                                    loginState === "signIn" && (
                                                        <Grid>
                                                            <Grid.Row style={{paddingTop: "3px", paddingBottom: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"}>
                                                                    {(accountLoginError)? <span style={{color: "red"}}><Icon name={"warning sign"} style={{color: "orange"}}  /><strong>Incorrect username or password.</strong></span> : null}
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{paddingBottom: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"} style={{paddingLeft: "30px", paddingRight: "30px"}}>
                                                                    <Input iconPosition={"left"} name={"email"} type={"email"} onChange={onChange} placeholder={"Email"} style={{maxWidth: "100%"}}
                                                                          error={(accountLoginError)} fluid>
                                                                        <Icon name={"at"} />
                                                                        <input />
                                                                    </Input>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{paddingBottom: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"} style={{paddingLeft: "30px", paddingRight: "30px"}}>
                                                                    <Input iconPosition={"left"} name={"password"} type={"password"} onChange={onChange} placeholder={"Password"} style={{maxWidth: "100%"}}
                                                                           error={(accountLoginError)} fluid>
                                                                        <Icon name={"key"} />
                                                                        <input />
                                                                    </Input>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{padding: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"right"}>
                                                                    <Button style={{backgroundColor: "transparent"}} size={"mini"}
                                                                    onClick={() => updateLoginState("forgotPassword")}
                                                                    >Forgot your password?</Button>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{paddingBottom: "10px", paddingTop: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"}>
                                                                    <Button onClick={signIn} animated={"vertical"} color={"blue"} loading={(loading)}>
                                                                        <Button.Content visible>
                                                                            Sign In
                                                                        </Button.Content>
                                                                        <Button.Content hidden>
                                                                            <Icon name={"arrow right"} />
                                                                        </Button.Content>
                                                                    </Button>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                        </Grid>
                                                    )
                                                }
                                                {
                                                    loginState === "forgotPassword" && (
                                                        <Grid>
                                                            <Grid.Row style={{paddingBottom: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"} style={{paddingLeft: "30px", paddingRight: "30px"}}>
                                                                    <Input iconPosition={"left"} name={"email"} type={"email"} onChange={onChange} placeholder={"Enter your email"} style={{maxWidth: "100%"}} fluid>
                                                                        <Icon name={"at"} />
                                                                        <input />
                                                                    </Input>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{paddingBottom: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"}>
                                                                    <Button onClick={forgotPassword} animated={"vertical"} color={"blue"} loading={(loading)}>
                                                                        <Button.Content visible>
                                                                            Send reset code
                                                                        </Button.Content>
                                                                        <Button.Content hidden>
                                                                            <Icon name={"arrow right"} />
                                                                        </Button.Content>
                                                                    </Button>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{paddingBottom: "0px", paddingTop: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"left"}>
                                                                    <Button icon onClick={() => updateLoginState("signIn")} style={{backgroundColor: "transparent"}} size={"big"}>
                                                                        <Icon name={"left arrow"} /> Back
                                                                    </Button>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                        </Grid>
                                                    )
                                                }
                                                {
                                                    loginState === "resetPassword" && (
                                                        <Grid>
                                                            <Grid.Row style={{paddingBottom: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"} style={{paddingLeft: "30px", paddingRight: "30px"}}>
                                                                    <Input iconPosition={"left"} name={"email"} type={"email"} onChange={onChange} placeholder={"Enter your email"} style={{maxWidth: "100%"}} fluid>
                                                                        <Icon name={"at"} />
                                                                        <input />
                                                                    </Input>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{paddingBottom: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"} style={{paddingLeft: "30px", paddingRight: "30px"}}>
                                                                    <Input iconPosition={"left"} name={"resetCode"} onChange={onChange} placeholder={"Enter reset code"} style={{maxWidth: "100%"}} fluid>
                                                                        <Icon name={"unlock alternate"} />
                                                                        <input />
                                                                    </Input>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{paddingBottom: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"} style={{paddingLeft: "30px", paddingRight: "30px"}}>
                                                                    <Input iconPosition={"left"} name={"password"} type={"password"} onChange={onChange} placeholder={"Enter new password"} style={{maxWidth: "100%"}} fluid>
                                                                        <Icon name={"key"} />
                                                                        <input />
                                                                    </Input>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{paddingBottom: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"}>
                                                                    <Button onClick={resetPassword} animated={"vertical"} color={"blue"} loading={(loading)}>
                                                                        <Button.Content visible>
                                                                            Update Password
                                                                        </Button.Content>
                                                                        <Button.Content hidden>
                                                                            <Icon name={"arrow right"} />
                                                                        </Button.Content>
                                                                    </Button>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{paddingBottom: "0px", paddingTop: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"left"}>
                                                                    <Button icon onClick={() => updateLoginState("signIn")} style={{backgroundColor: "transparent"}} size={"big"}>
                                                                        <Icon name={"left arrow"} /> Back
                                                                    </Button>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                        </Grid>
                                                    )
                                                }
                                                {
                                                    loginState === "newUserPassword"  && (
                                                        <Grid>
                                                            <Grid.Row style={{paddingBottom: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"} style={{paddingLeft: "30px", paddingRight: "30px"}}>
                                                                    <Input iconPosition={"left"} name={"password"} type={"password"} onChange={onChange} placeholder={"Enter new password"} style={{maxWidth: "100%"}} fluid>
                                                                        <Icon name={"key"} />
                                                                        <input />
                                                                    </Input>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"center"}>
                                                                    <Button onClick={setNewPassword} animated={"vertical"} color={"blue"} loading={(loading)}>
                                                                        <Button.Content visible>
                                                                            Set Password
                                                                        </Button.Content>
                                                                        <Button.Content hidden>
                                                                            <Icon name={"arrow right"} />
                                                                        </Button.Content>
                                                                    </Button>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                            <Grid.Row style={{paddingBottom: "0px", paddingTop: "0px"}}>
                                                                <Grid.Column verticalAlign={"middle"} textAlign={"left"}>
                                                                    <Button icon onClick={() => updateLoginState("signIn")} style={{backgroundColor: "transparent"}} size={"big"}>
                                                                        <Icon name={"left arrow"} /> Back
                                                                    </Button>
                                                                </Grid.Column>
                                                            </Grid.Row>
                                                        </Grid>
                                                    )
                                                }
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>
                                </div>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
}

const mapStateToProps = (state) => {
    return {
        loginState: state.loginState.currentState,
    };
};

const mapDispatchToProps = {
    updateLoginState,
};


export default connect(mapStateToProps, mapDispatchToProps)(Login);
