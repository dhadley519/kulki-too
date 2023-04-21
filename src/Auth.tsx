import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import {StatusCodes} from "http-status-codes";
import {panic} from "panic-fn";

export default function Auth() {

    const navigate = useNavigate();
    let [isSignIn, changeSignInMode] = useState(true)
    let [email, setEmail] = useState('')
    let [password, setPassword] = useState('')
    let [failure, setFailure] = useState('')
    const changeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value)
    }

    const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
    }

    const changeMode = () => {
        changeSignInMode(!isSignIn)
    }

    function authenticate() {
        return authOrRegister('/login')
    }

    function register() {
        return authOrRegister('/register')
    }

    function authOrRegister(url: string) {

        const u: { email: string, password: string } = {
            email: email,
            password: password,
        }


        fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json;charset=UTF-8',
            },
            body: JSON.stringify(u),
        })
            .then(response => {
                if ([StatusCodes.OK].includes(response.status)) {
                    navigate("/game");
                }
                if ([StatusCodes.UNAUTHORIZED].includes(response.status)) {
                    setFailure("Invalid email or password");
                }
            }).catch(error => {
            panic(error)
        })
    }

    return (
        <div className="Auth-form-container">
            <div className="Auth-form">
                <div className="Auth-form-content">
                    <h3 className="Auth-form-title">{(isSignIn) ? "Sign In" : "Sign Up"}</h3>
                    <div
                        className="text-center">{(isSignIn) ? "Not registered yet?" : "Already registered?"}{" "}<span
                        className="link-primary" onClick={changeMode}>{(isSignIn) ? "Sign Up" : "Sign In"}</span>
                    </div>
                    <div className="form-group mt-3">
                        <label>Email address</label>
                        <input
                            type="email"
                            className="form-control mt-1"
                            placeholder="Enter email"
                            onChange={changeEmail}
                        />
                    </div>
                    <div className="form-group mt-3">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control mt-1"
                            placeholder="Enter password"
                            onChange={changePassword}
                        />
                    </div>
                    <div className="d-grid gap-2 mt-3">
                        <button type="submit" className="btn btn-primary"
                                onClick={(isSignIn) ? authenticate : register}>Submit
                        </button>
                    </div>
                    <div><span style={{color: "red"}}>{failure}</span></div>
                    <p className="text-center mt-2" style={{visibility: isSignIn ? 'visible' : 'hidden'}}>Forgot <a
                        href="forgotPassword">password?</a></p>
                </div>
            </div>
        </div>
    )
}