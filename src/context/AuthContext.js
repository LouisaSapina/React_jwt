import { createContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import { useHistory } from "react-router-dom";

const AuthContext = createContext()

export default AuthContext;

export const AuthProvider = ({children}) => {

    let [user, setUser] = useState(() => localStorage.getItem('AuthTokens') ? JSON.parse(localStorage.getItem('AuthTokens')) : null);
    let [AuthTokens, setAuthTokens] = useState(() => localStorage.getItem('AuthTokens') ? jwt_decode(localStorage.getItem('AuthTokens')) : null);
    let [loading, setLoading] = useState(true);

    const history = useHistory();

    let loginUser = async (e ) => {
        e.preventDefault()
        let response = await fetch('http://127.0.0.1:8000/api/token/', {
            method:'POST',
            headers:{'Content-Type':'application/json'
            },
            body:JSON.stringify({'username':e.target.username.value, 'password':e.target.password.value})
        })
        let data = await response.json()

        if(response.status === 200) {
            setAuthTokens(data)
            setUser(jwt_decode(data.access))
            localStorage.setItem('AuthTokens', JSON.stringify(data))
            history.push('/')
        } else {
            alert('Smth went wrong!')
        }
    }

    let logoutUser = () => {
        setAuthTokens(null)
        setUser(null)
        localStorage.removeItem('AuthTokens')
        history.push('/login')
    } 

    let updateToken = async () => {
        console.log('Update token!')
        let response = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
            method:'POST',
            headers:{'Content-Type':'application/json'
            },
            body:JSON.stringify({'refresh': AuthTokens?.refresh})
        })
        let data = await response.json()

        if(response.status === 200){
            setAuthTokens(data)
            setUser(jwt_decode(data.access))
            localStorage.setItem('AuthTokens', JSON.stringify(data))
        } else {
            logoutUser()
        }

        if(loading){
            setLoading(false)
        }
    }

    let contextData = {
        user:user,
        AuthTokens:AuthTokens,
        logoutUser:logoutUser,
        loginUser:loginUser
    }

    useEffect(() => {

        if(loading){
            updateToken()
        }

        let fourMinutes = 1000 * 60 * 4;
        let interval = setInterval(() => {
            if(AuthTokens){
                updateToken()
            }
        }, 2000)
        return () => clearInterval(interval)
    }, [AuthTokens, loading])

    return(
        <AuthContext.Provider value={contextData}>
            {loading ? null : children}
        </AuthContext.Provider>
    )
}