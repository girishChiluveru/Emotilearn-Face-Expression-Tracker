import {useState} from 'react'
import axios from 'axios'
import {toast} from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function ChildRegister() {
  const navigate =useNavigate()
  const [data, setData] = useState({
    childname:'',
    password:'',
  })

  const registerChild = async (e) => {
    e.preventDefault();
    const{childname,password}= data
    try{
      const {data}= await axios.post('/register',{
        childname,password
      })
      if(data.error){
        toast.error(data.error)
      }else{
        setData({})
        toast.success("Registration successful")
        navigate('/child-login')
      }


    }catch(error){
      console.log(error)

    }

  }


  return (
    <div>
      <h3>Register</h3>
      <br></br>
      <form onSubmit={registerChild}>
      <label>Child Name</label>
      <input type='text' placeholder='enter name'value={data.childname} onChange={(e) => setData({...data,childname: e.target.value})}/>
        <label>Password</label>
        <input type='text' placeholder='enter password'value={data.password} onChange={(e) => setData({...data,password: e.target.value})}/>
        <button type='submit'>Submit</button>
      </form>
    </div>
  )
}